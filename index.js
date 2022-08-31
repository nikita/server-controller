require("dotenv").config();
const { DISCORD_PREFIX, DISCORD_TOKEN, DISCORD_CHANNEL_ID } = process.env;
const Discord = require("discord.js");
const client = new Discord.Client();
const ec2 = new (require("@aws-sdk/client-ec2").EC2)();
const users = require("./users.json");
const { getStats, logAction } = require("./db");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  // Check if message was not from a bot
  if (msg.author.bot) return;

  // Check if message was sent in guild
  if (msg.channel.type !== "text") return;

  // Check if message was sent in our defined channel
  if (msg.channel.id !== DISCORD_CHANNEL_ID) return;

  // Check if message starts with our prefix
  if (!msg.content.startsWith(DISCORD_PREFIX)) return;

  const args = msg.content.slice(DISCORD_PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const user = users.find((user) => user.discordId === msg.author.id);

  if (command === "stats") {
    let embed = new Discord.MessageEmbed()
      .setTitle("Stats")
      .setDescription("Monthly usage stats per user");

    const stats = Object.entries(await getStats());

    if (stats.length) {
      for (const [key, value] of stats) {
        embed.addField(
          (await client.users.fetch(key)).username,
          `${(value.currentMonthUsage / 60).toFixed(
            2
          )} hours or ${value.currentMonthUsage.toFixed(2)} minutes | started ${
            value.times
          } times`,
          true
        );
      }
    } else {
      embed.addField(
        "?",
        "No stats for this month yet, check back later",
        true
      );
    }

    return msg.channel.send(embed);
  } else if (command === "status") {
    let embed = new Discord.MessageEmbed().setTitle("Status");

    for (let i = 0; i < user.instances.length; i++) {
      const response = await ec2.describeInstances({
        InstanceIds: [user.instances[i]],
      });

      if (response.Reservations) {
        const instance = response.Reservations[0].Instances[0];

        embed
          .addField("Instance Id", i)
          .addField("Instance Type", instance.InstanceType)
          .addField("Platform", instance.Platform)
          .addField("Region", instance.Placement.AvailabilityZone)
          .addField("Public IP Address", instance.PublicIpAddress)
          .addField("State", instance.State.Name);

        if (user.instances.length - 1 !== i) embed.addField("\u200B", "\u200B");
      }
    }

    return msg.channel.send(embed);
  } else if (command === "start") {
    if (args && !user.instances[args[0]])
      return msg.channel.send(`No instance with id ${args[0]} exists!`);

    const response = await ec2.startInstances({
      InstanceIds: [user.instances[args[0]]],
    });

    // Make sure we don't mess with already running instances
    if (response.StartingInstances[0].CurrentState.Name !== "running")
      await logAction("start", user.discordId, user.instances[args[0]]);

    return msg.channel.send(
      new Discord.MessageEmbed()
        .setTitle(`Successfully started instance id ${args[0]}`)
        .addField(
          "Instance State",
          response.StartingInstances[0].CurrentState.Name
        )
    );
  } else if (command === "stop") {
    if (args && !user.instances[args[0]])
      return msg.channel.send(`No instance with id ${args[0]} exists!`);

    const response = await ec2.stopInstances({
      InstanceIds: [user.instances[args[0]]],
    });

    await logAction("stop", user.discordId, user.instances[args[0]]);

    return msg.channel.send(
      new Discord.MessageEmbed()
        .setTitle(`Successfully stopped instance id ${args[0]}`)
        .addField(
          "Instance State",
          response.StoppingInstances[0].CurrentState.Name
        )
    );
  } else if (command === "terminate") {
    if (args && !user.instances[args[0]])
      return msg.channel.send(`No instance with id ${args[0]} exists!`);

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
