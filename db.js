const moment = require("moment");
const PicoDB = require("picodb");
const fs = require("fs").promises;

// Init db
const db = PicoDB();

db.insertMany(require("./db.json"));

const logAction = async (action, userId, instanceId) => {
  const all = await db.find({}).toArray();

  if (action === "start") {
    await db.insertOne({
      userId,
      instanceId,
      startTime: moment().valueOf(),
      stopTime: null,
    });
  } else if (action === "stop") {
    const lastAction = all
      .slice()
      .reverse()
      .find((stat) => stat.userId === userId && stat.instanceId == instanceId);

    db.updateOne(
      { _id: lastAction._id },
      { $set: { stopTime: moment().valueOf() } }
    );
    //db.get("statusLogs").push({}).write();
  }

  // Save db to file after event
  await fs.writeFile(
    "./db.json",
    JSON.stringify(await db.find({}).toArray(), null, 2)
  );
};

const getStats = async () => {
  const stats = await db.find({}).toArray();

  let usage = {};

  for (const stat of stats) {
    const diffTime = moment(stat.stopTime).diff(moment(stat.startTime));
    const duration = moment.duration(diffTime);

    if (!usage[stat.userId])
      usage[stat.userId] = { currentMonthUsage: 0, times: 0 };

    // Only show this month usage
    if (moment(stat.startTime).isAfter(moment().startOf("month").toDate())) {
      usage[stat.userId].currentMonthUsage =
        usage[stat.userId].currentMonthUsage + duration.asMinutes();

      usage[stat.userId].times++;
    }
  }

  return usage;
};

module.exports = { logAction, getStats };
