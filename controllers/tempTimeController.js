import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";
import UserModel from "../models/User.js";


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
        console.log("req received ", req.body);
        try {
            const tempTime = await TempTimeModel.findOne({
                userId: req.body.userId, 
                date: req.body.date
            });
            
            
            if(tempTime){
              const time = Date.now() - tempTime?.startTime - tempTime?.breakTime;
              res.status(200).json({ time, started: tempTime.started });
              // console.log("Time fetched ", time, tempTime.started);
            }else{
              res.status(200).json({ time:0 , started: false });
            }
            
        } catch (err) {
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


export const fetchTimeEntries = async (req, res) => {
  try {
    const userId  = req.params.userId; // Get userId from URL parameters
    // Find the timesheet document for that specific user
    const timeSheetDoc = await TimeSheetModel.findOne({ userId });
    if (!timeSheetDoc) {
      return res.status(404).json({ message: "No timesheet found for this user." });
    }
    res.status(200).json(timeSheetDoc.timeSheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUserTimesheet = async (req, res) => {
    try {
        console.log("fetching the time sheet...");
        const entries = await TimeSheetModel.find();
        const result = [];
        for (const entry of entries) {
            const user = await UserModel.findById(entry.userId).select("name");
            const userName = user ? user.name : "Unknown User";

            for (const sheet of entry.timeSheet) {
              result.push({
                userId: entry.userId,
                name: userName,
                timeSheet: sheet, 
              });
            }
        }
        console.log(result);
        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
  };
  

  export const updateTimeSheetStatus = async (req, res) => {
    try {
        console.log("updating ------")
        console.log(req.body);
      const { userId, date, status, comments } = req.body;

      // Find one entry matching userId and date and update it.
      const updatedEntry = await TimeSheetModel.findOneAndUpdate(
        { userId, "timeSheet.date": date },
        { $set: { "timeSheet.$.status": status, "timeSheet.$.comment": comments } },
        { new: true }
      );
      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      res.status(200).json(updatedEntry);
    } catch (err) {
      console.console.error();
      
      res.status(500).json({ message: err.message });
    }


   
  };
  