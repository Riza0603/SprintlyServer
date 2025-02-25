import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";


export const startTimer = async (req, res) => {
    console.log("Timer Started ", req.body);
    try {
        const { userId, startTime, elapsedTime, breakTime } = req.body;
    
        const tempTimeData = {
        userId: req.body.userId,
        startTime: req.body.startTime,
        elapsedTime: req.body.elapsedTime,
        breakTime: req.body.breakTime,
        date: req.body.date,
        started : req.body.started
        };
        
        // Save TempTime
        const tempTime = new TempTimeModel(tempTimeData);
        await tempTime.save();
    
        res.status(201).json(tempTime); // Return the saved tempTime
    } catch (err) {
        console.error("Error in addTempTime:", err.message);
        res.status(400).json({ message: err.message });
    }
    };

export const getTime = async (req, res) => {
    console.log("req recieved ",req.body.date);
    try {
        const tempTime = await TempTimeModel.findOne
        ({ userId: req.body.userId, date:req.body.date});
        const time = Date.now()-tempTime.startTime-tempTime.breakTime;
        
        console.log("Time fetched ",time,tempTime.started);
        res.status(200).json({time,started:tempTime.started}); // Return the saved tempTime
    }
    catch (err) {
        console.error("Error in getTime:", err.message);
        res.status(400).json({ message: err.message });
    }
    };
export const stopTimer = async (req, res) => {
    console.log("Timer Stopped ", req.body);
    try {
        const tempTime = await TempTimeModel.findOneAndUpdate({userId:req.body.userId,date:req.body.date},{elapsedTime:req.body.elapsedTime,started:false},{new:true});
        if (!tempTime) {
            return res.status(404).json({ message: "Timer entry not found" });
        }
        const timeSheetData = {
            userId: req.body.userId,
            timeSheet:{date: req.body.date,
            time: req.body.elapsedTime,}
        };
        let timeSheet = await TimeSheetModel.findOne({ userId: req.body.userId });

        if (!timeSheet) {
            // If no record exists, create a new one
            timeSheet = new TimeSheetModel({
                userId: req.body.userId,
                timeSheet: [{ date: req.body.date, time: req.body.elapsedTime }]
            });
        }else {
            let found = false; // Flag to track if the date already exists

            // Use .map() to update existing entry if date matches
            timeSheet.timeSheet = timeSheet.timeSheet.map(entry => {
                if (entry.date === req.body.date) {
                    found = true;
                    return { ...entry, time: entry.time + req.body.elapsedTime }; // Update time
                }
                return entry;
            });

            // If date was not found, append a new entry
            if (!found) {
                timeSheet.timeSheet.push({ date: req.body.date, time: req.body.elapsedTime });
            }
        }

        await timeSheet.save();
        await TempTimeModel.findOneAndDelete({userId:req.body.userId,date:req.body.date});

        res.status(201).json(tempTime); // Return the saved tempTime
    } catch (err) {
        console.error("Error in addTempTime:", err.message);
        res.status(400).json({ message: err.message });
    }
    }