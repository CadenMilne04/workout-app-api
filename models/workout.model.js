const mongoose = require("mongoose");

const Workout = new mongoose.Schema(
    {
        workoutNumber: { type: Number},
        excersizes: { type: Array, "default" : [] },
    },
    { collection: "workout-data" }
);

const model = mongoose.model("WorkoutData", Workout);

module.exports = model;
