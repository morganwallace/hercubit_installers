cd "../../../"
git clone git@github.com:morganwallace/hercubit_ds.git
cd hercubit_ds
virtualenv venv
source venv/bin/activate
echo "Installing various libraries - takes about 60 seconds."
pip install -r requirements.txt
mv hercubit venv/lib/python2.7/site-packages/
rm requirements.txt

echo " "
echo " "
echo "---------------------- "
echo "INSTALLATION COMPLETE"
echo "You may quit the installer and open the hercubit_ds directory"