#!/bin/bash
cd /root
apt install jq -y
sudo apt update -y && sudo apt upgrade -y

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 20.6

if [ $? -ne 0 ]; then
    echo "Error: Failed to install Node.js version 20.6 using NVM."
    exit 1
fi

if ! command -v ssh-keygen &> /dev/null; then
    echo "Error: ssh-keygen is not installed. Please install OpenSSH before proceeding."
    exit 1
fi

read -p "Enter GitHub repository URL: " repo_url
read -p "Enter GitHub username: " github_username
read -p "Enter project name: " project_name
read -p "Enter homepage URL: " homepage_url
read -p "Enter author's name: " author_name
read -p "Enter your mail addres: " mail_address

read -p "SSH key icin herhangi bir isim (e.g., 'my_key'): " key_name
ssh-keygen -t rsa -b 4096 -C "$mail_address" -f ~/.ssh/$key_name
if [ $? -eq 0 ]; then
    echo "SSH key generated successfully."
else
    echo "Failed to generate SSH key. Please check for any errors and try again."
fi
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/$key_name

#!/bin/bash

add_ssh_keys() {
    ssh_dir="$HOME/.ssh"
    
    if [ ! -d "$ssh_dir" ]; then
      echo "SSH directory not found."
      exit 1
    fi
    
    key_files=$(ls "$ssh_dir")
    
    if [ -z "$key_files" ]; then
      echo "No key files found in $ssh_dir"
      exit 1
    fi
    
    for key_file in $ssh_dir/*; do
        if [[ -f "$key_file" && "${key_file##*.}" == "pub" ]]; then
            continue
        fi
        ssh-add "$key_file"
    done
}

update_known_hosts() {
    ssh-keyscan github.com >> ~/.ssh/known_hosts
}

run_script() {
    while true; do
        add_ssh_keys
        update_known_hosts
        sleep $((30*24*60*60))
    done
}

run_script




echo "github settin/ssh-and-gpg-keys e eklenecek public key:"
cat ~/.ssh/$key_name.pub
read -p "Public keyi githuba ekledikten sonra Enter e basın..."
git clone "https://github.com/flechemano/simpleteaproject.git"
mv simpleteaproject "$project_name"
cd "$project_name"
rm -rf .git .github package-lock.json 
git init

git config --global user.email "$mail_address"
git config --global user.name "$github_username"
git remote add origin git@github.com:"$github_username"/"$project_name".git
git branch -M main
git pull origin main

chmod 644 /root/.ssh/"$key_name".pub
chmod 600 /root/.ssh/"$key_name"

project_description="A decentralized application (dApp) built on blockchain technology to facilitate trustless trading of tokens."

echo "# $project_name
## Overview
$project_description
## Features
- **Token Trading:** Users can trade various Ethereum-based tokens in a decentralized and trustless manner.
- **Decentralized:** The application operates without a central authority, providing users with full control over their funds.
- **Smart Contracts:** Trading is facilitated by smart contracts deployed on the Ethereum blockchain, ensuring secure and transparent transactions.
- **Web3 Integration:** Interact with the Ethereum blockchain and smart contracts from the frontend using Web3.js, enabling seamless integration with decentralized applications (dApps) and wallets.
## Technologies Used
- **Ethereum:** Utilize the Ethereum blockchain for token trading and smart contract execution.
- **Solidity:** Develop smart contracts using Solidity, a high-level programming language specifically designed for writing Ethereum smart contracts.
- **Web3.js:** Interact with the Ethereum blockchain and smart contracts from the frontend using Web3.js, a JavaScript library for Ethereum development.
- **Node.js:** Build the backend server using Node.js, a JavaScript runtime environment for server-side development.
- **Express.js:** Create RESTful APIs for interacting with the server using Express.js, a web application framework for Node.js.
## Getting Started
## Contribution
## License
This project is licensed under the [MIT License](LICENSE).
## Contact
For questions or inquiries, please contact $author_name.
" > README.md

sed -i "s|your_email@example.com|${github_username}@users.noreply.github.com|g" README.md

echo "MIT License
Copyright (c) 2024
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the \"Software\"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE." > LICENSE



new_package_name="$project_name"
jq --arg new_repo_url "$repo_url" '.repository.url = $new_repo_url' package.json > temp.json && mv temp.json package.json
jq --arg new_homepage_url "$homepage_url" '.homepage = $new_homepage_url' package.json > temp.json && mv temp.json package.json
jq --arg new_package_name "$new_package_name" '.name = $new_package_name' package.json > temp.json && mv temp.json package.json
jq --arg new_author_name "$author_name" '.author = $new_author_name' package.json > temp.json && mv temp.json package.json

echo "Updated package.json successfully."

chmod +x "$0"

npm install

git add .
git commit -m "Initial"
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/"$key_name"
git push origin main --force

echo " ignore github errors, keep publish your package"

npm version 1.2.3
npm publish --acces=public

echo "check your published package at: https://npmjs.com/package/"$project_name" "

