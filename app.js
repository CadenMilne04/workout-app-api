require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user.model");
const Workout = require("./models/workout.model");
const Split = require("./models/split.model")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//Init App
const app = express();

//Init Middleware
app.use(cors());
app.use(express.json());

//Connect Mongoose
mongoose
    .connect(
        "mongodb+srv://cadenmilne04:" +
            process.env.MONGOOSE_KEY +
            "@cluster0.ro1tpr1.mongodb.net/workoutAppDB"
    )
    .then(() => console.log("MongoDB Connected"))
    .catch((e) => console.log(e));

//Routes
app.patch("/api/saveUserWorkout", async (req, res) => {
    const token = req.headers["x-access-token"];
    const { date, type, weightFields } = req.body;
    const savedWorkout = { date: date, type: type, workouts: weightFields };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await User.updateOne(
            { email: email },
            { $push: { savedWorkouts: savedWorkout } }
        );

        return res.json({
            status: "ok",
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", error: "Invalid Token" });
    }
});

app.post("/api/addWorkout", async (req, res) => {
    const {
        workoutNumberAsNumber,
        type,
        bodyPart,
        setsAsNumber,
        excersizeName,
        description,
    } = req.body;

    const workoutAtNumber = await Workout.findOne({
        workoutNumber: workoutNumberAsNumber,
    });

    const workoutObject = {
        type: type,
        bodyPart: bodyPart,
        excersizeName: excersizeName,
        sets: setsAsNumber,
        description: description,
    };

    if (workoutAtNumber) {
        await Workout.updateOne(
            { workoutNumber: workoutNumberAsNumber },
            { $push: { excersizes: workoutObject } }
        );
        res.json({ status: "ok" });
    } else {
        try {
            await Workout.create({
                workoutNumber: workoutNumberAsNumber,
            });
            await Workout.updateOne(
                { workoutNumber: workoutNumberAsNumber },
                { $push: { excersizes: workoutObject } }
            );
            res.json({ status: "ok" });
        } catch (error) {
            console.log(error);
            res.json({ status: "error", error: "Couldn't Add Workout" });
        }
    }
});

app.post("/api/register", async (req, res) => {
    const plaintextPassword = req.body.password;
    //Hash Password Using Bcrypt
    bcrypt.genSalt(saltRounds, async function (err, salt) {
        bcrypt.hash(plaintextPassword, salt, async function (err, hash) {
            try {
                const user = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: hash,
                    workoutOn: 0,
                    savedWorkouts: [],
                });
                res.json({ status: "ok" });
            } catch (error) {
                res.json({ status: "error", error: "Duplicate email" });
            }
        });
    });
});

app.post("/api/login", async (req, res) => {
    let plaintextPassword = req.body.password;
    try {
        const user = await User.findOne({
            email: req.body.email,
        });

        const userPassword = user.password;

        bcrypt.compare(plaintextPassword, userPassword, function (err, result) {
            if (result) {
                const token = jwt.sign(
                    {
                        name: user.name,
                        email: user.email,
                    },
                    process.env.JWT_SECRET
                );

                res.json({ status: "ok", user: token });
            } else {
                res.json({ status: "error", user: false });
            }
        });
    } catch (error) {
        res.json({ status: "error", user: false });
    }
});

app.get("/api/getWorkouts", async (req, res) => {
    try {
        const workouts = await Workout.find({});
        return res.json({ status: "ok", workouts: workouts });
    } catch (error) {
        res.json({ status: "error", error: "Error Loading Workouts" });
    }
});

app.get("/api/getUserWorkouts", async (req, res) => {
    const token = req.headers["x-access-token"];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await User.findOne({ email: email });

        return res.json({
            status: "ok",
            workouts: user.savedWorkouts,
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", error: "Invalid Token" });
    }
});

app.patch("/api/deleteUserWorkout", async (req, res) => {
    const token = req.headers["x-access-token"];
    const { dateToDelete } = req.body;

    console.log(dateToDelete);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        const user2 = await User.updateOne(
            { email: email },
            {
                $pull: { savedWorkouts: { date: dateToDelete } },
            }
        );

        return res.json({
            status: "ok",
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", error: "Invalid Token" });
    }
});

app.get("/api/name", async (req, res) => {
    const token = req.headers["x-access-token"];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await User.findOne({ email: email });

        return res.json({
            status: "ok",
            name: user.name,
            workoutOn: user.workoutOn,
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", error: "Invalid Token" });
    }
});

app.patch("/api/updateUserDay", async (req, res) => {
    const token = req.headers["x-access-token"];
    const newWorkoutOn = req.body.newWorkoutOn;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const user = await User.updateOne(
            { email: email },
            { workoutOn: newWorkoutOn }
        );

        return res.json({
            status: "ok",
        });
    } catch (error) {
        console.log(error);
        res.json({ status: "error", error: "Invalid Token" });
    }
});

app.post("/api/addSplitTemplate", async (req, res) => {
    const {workouts, isPublic} = req.body;
    console.log(workouts);
    console.log(JSON.parse(workouts));

    try {
        await Split.create({workouts: JSON.parse(workouts), isPublic: isPublic});
        res.json({ status: "ok" });
    } catch (error) {
        res.json({ status: "error", error: "Couldn't Add Workout Split" });
    }
});

//Server start
app.listen(3000, () => console.log("Server started on port 3000!"));
