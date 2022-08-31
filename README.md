# server-controller

Control a AWS EC2 instance using Discord.

## Instructions

1. Rename `.env.example` → `.env`
2. Open .env
3. Change the DISCORD_TOKEN value to your bots discord token
4. Change the DISCORD_CHANNEL_ID to the channel id you want to use to control the instance
5. Create a user in [AWS IAM](https://console.aws.amazon.com/iam/home#/users) with `AmazonEC2FullAccess` permission
6. Go to `Security credentials` tab for the user and click `Create access key`
7. Change the AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY to the ID / SECRET you got in the last step
8. Go to your [EC2 Instances](https://console.aws.amazon.com/ec2/v2/home#Instances:) & copy the `Instance ID` of the instance you would like to control to AWS_INSTANCE_ID
9. Run `npm install`
10. Run `npm start`

## LICENSE

[MIT](LICENSE)
