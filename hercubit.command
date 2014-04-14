#! /bin/bash
echo "Hercubit is starting up!  :)"
echo " "
cd  "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "../../../"

# 
python update_venv_path.py
source venv/bin/activate
echo Updating to latest version of Hercubit
git add saved/
git commit -m "adding raw_data"
git pull
# git push
which python
python Website2/app.py production
