require("dotenv").config();
const {
  DISCORD_PREFIX,
  DISCORD_TOKEN,
  AWS_INSTANCE_ID,
  DISCORD_CHANNEL_ID,
} = process.env;
const Discord = require("discord.js");
const client = new Discord.Client();
const ec2 = new (require("@aws-sdk/client-ec2").EC2)();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  // Check ifm essage was not from a bot
  if (msg.author.bot) return;

  // Check if message was sent in guild
  if (msg.channel.type !== "text") return;

  // Check if message was sent in our defined channel
  if (msg.channel.id !== DISCORD_CHANNEL_ID) return;

  // Check if message starts with our prefix
  if (!msg.content.startsWith(DISCORD_PREFIX)) return;

  const args = msg.content.slice(DISCORD_PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "status") {
    const response = await ec2.describeInstances({
      InstanceIds: [AWS_INSTANCE_ID],
    });

    if (response.Reservations) {
      const instance = response.Reservations[0].Instances[0];

      return msg.channel.send(
        new Discord.MessageEmbed()
          .setTitle("Status")
          .addField("Instance Type", instance.InstanceType)
          .addField("Platform", instance.Platform)
          .addField("Public IP Address", instance.PublicIpAddress)
          .addField("State", instance.State.Name)
      );
    }
  } else if (command === "start") {
    const response = await ec2.startInstances({
      InstanceIds: [AWS_INSTANCE_ID],
    });

    return msg.channel.send(
      new Discord.MessageEmbed()
        .setTitle("Successfully started instance")
        .addField(
          "Instance State",
          response.StartingInstances[0].CurrentState.Name
        )
    );
  } else if (command === "stop") {
    const response = await ec2.stopInstances({
      InstanceIds: [AWS_INSTANCE_ID],
    });

    return msg.channel.send(
      new Discord.MessageEmbed()
        .setTitle("Successfully stopped instance")
        .addField(
          "Instance State",
          response.StoppingInstances[0].CurrentState.Name
        )
    );
  } else if (command === "terminate") {
    const response = await ec2.terminateInstances({
      InstanceIds: [AWS_INSTANCE_ID],
    });

    return msg.channel.send(
      new Discord.MessageEmbed()
        .setTitle("Successfully terminated instance")
        .addField(
          "Instance State",
          response.TerminatingInstances[0].CurrentState.Name
        )
    );
  }
});

client.login(DISCORD_TOKEN);
