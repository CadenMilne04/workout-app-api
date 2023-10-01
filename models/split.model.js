const mongoose = require("mongoose");

const Split = new mongoose.Schema(
    {
        workouts: { type: Array, "default" : [] },
        isPublic: Boolean,
    },
    { collection: "split-templates" }
);

const model = mongoose.model("SplitData", Split);

module.exports = model;
