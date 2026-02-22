import sys
import json
import pandas as pd
import os
import re
from sqlalchemy import create_engine
from urllib.parse import quote_plus  # <--- IMPORT THIS

# --- 1. FUNCTION TO READ CREDENTIALS FROM PHP FILE ---
def get_db_credentials(php_file_path):
    creds = {}
    try:
        with open(php_file_path, 'r') as file:
            content = file.read()
            
            # Regex patterns to find PHP variables
            host_match = re.search(r'\$this->host\s*=\s*["\']([^"\']+)["\'];', content)
            db_match   = re.search(r'\$this->db_name\s*=\s*["\']([^"\']+)["\'];', content)
            user_match = re.search(r'\$this->username\s*=\s*["\']([^"\']+)["\'];', content)
            pass_match = re.search(r'\$this->password\s*=\s*["\']([^"\']*)["\'];', content)

            if host_match and db_match and user_match:
                creds['host'] = host_match.group(1)
                creds['db']   = db_match.group(1)
                creds['user'] = user_match.group(1)
                creds['pass'] = pass_match.group(1) if pass_match else ""
                return creds
            
            # Pattern 2: Procedural ($host = 'value';)
            host_match = re.search(r'\$host\s*=\s*["\']([^"\']+)["\'];', content)
            db_match   = re.search(r'\$db_name\s*=\s*["\']([^"\']+)["\'];', content)
            user_match = re.search(r'\$username\s*=\s*["\']([^"\']+)["\'];', content)
            pass_match = re.search(r'\$password\s*=\s*["\']([^"\']*)["\'];', content)

            if host_match:
                creds['host'] = host_match.group(1)
                creds['db']   = db_match.group(1)
                creds['user'] = user_match.group(1)
                creds['pass'] = pass_match.group(1) if pass_match else ""
                return creds

    except Exception as e:
        print(json.dumps({"error": f"Failed to read PHP config: {str(e)}", "data": []}))
        sys.exit(1)

    return None

# --- 2. SETUP CONNECTION ---

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, '../config/database.php')

credentials = get_db_credentials(config_path)

if not credentials:
    print(json.dumps({"error": "Could not find database credentials in config file.", "data": []}))
    sys.exit(1)

# --- THE FIX IS HERE ---
# URL encode the password to handle special characters like '@', '/', ':'
safe_password = quote_plus(credentials['pass'])
safe_user = quote_plus(credentials['user']) # Good practice to encode user too

# Create Connection String
# Note: We use the encoded variables here
db_connection_str = f"mysql+mysqlconnector://{safe_user}:{safe_password}@{credentials['host']}/{credentials['db']}"


# --- 3. MAIN ANALYTICS FUNCTION ---
def get_analytics(faculty_id, grade_filter, batch_filter):
    try:
        # Connect
        db_connection = create_engine(db_connection_str)

        # Query - (Cleaned up f-string formatting for SQL)
        query = f"""
            SELECT 
                a.title, 
                a.subject, 
                a.grade, 
                a.batch,
                s.marks, 
                s.submitted_at, 
                s.status
            FROM assignments a
            LEFT JOIN submissions s ON a.id = s.assignment_id
            WHERE a.faculty_id = {faculty_id}
        """
        
        df = pd.read_sql(query, db_connection)

        if df.empty:
            print(json.dumps({"completion": [], "performance": [], "subjects": [], "batches": []}))
            return

        # Filtering logic
        if grade_filter != 'All':
            df = df[df['grade'] == grade_filter]
        if batch_filter != 'All':
            df = df[df['batch'] == batch_filter]
            
        if df.empty:
            print(json.dumps({"completion": [], "performance": [], "subjects": [], "batches": []}))
            return

        # Metrics
        # 1. Completion
        completion = df[df['submitted_at'].notna()]['title'].value_counts().reset_index()
        completion.columns = ['name', 'completed']
        completion_data = completion.head(5).to_dict(orient='records')

        # 2. Performance
        graded_df = df[df['marks'].notna()].copy()
        if not graded_df.empty:
            performance = graded_df.groupby('title')['marks'].mean().reset_index()
            performance.columns = ['name', 'score']
            performance['score'] = performance['score'].round(1)
            performance_data = performance.head(5).to_dict(orient='records')
        else:
            performance_data = []

        # 3. Subjects
        subject_counts = df['subject'].value_counts().reset_index()
        subject_counts.columns = ['name', 'value']
        subject_data = subject_counts.to_dict(orient='records')

        # 4. Batches
        batch_counts = df[df['submitted_at'].notna()]['batch'].value_counts().reset_index()
        batch_counts.columns = ['name', 'attendance']
        batch_data = batch_counts.to_dict(orient='records')

        result = {
            "completion": completion_data,
            "performance": performance_data,
            "subjects": subject_data,
            "batches": batch_data
        }
        print(json.dumps(result))

    except Exception as e:
        # Catch connection errors here specifically if needed
        print(json.dumps({"error": str(e), "completion": [], "performance": [], "subjects": [], "batches": []}))

if __name__ == "__main__":
    f_id = sys.argv[1] if len(sys.argv) > 1 else 1
    gr = sys.argv[2] if len(sys.argv) > 2 else 'All'
    ba = sys.argv[3] if len(sys.argv) > 3 else 'All'
    
    get_analytics(f_id, gr, ba)