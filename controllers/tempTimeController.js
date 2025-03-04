import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";
import UserModel from "../models/User.js";


export const startTimer = async (req, res) => {
   
    
    try {
        const { userId, startTime, elapsedTime, breakTime } = req.body;
    
        const tempTimeData = {
        userId: req.body.userId,
        startTime: req.body.startTime,
        elapsedTime: req.body.elapsedTime,
        breakTime: req.body.breakTime,
        date: req.body.date,
        projectName:req.body.projectName,
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
            if(tempTime.paused===true){
                const time = tempTime.pausedAt-tempTime.startTime-tempTime.breakTime;
                // console.log("Time fetched ",time,tempTime.started);
                res.status(200).json({time,started:tempTime.started,paused:tempTime.paused,project:tempTime.projectName}); // Return the saved tempTime
            }else{
                const time = Date.now()-tempTime.startTime-tempTime.breakTime;
                // console.log("Time fetched ",time,tempTime.started);
                res.status(200).json({time,started:tempTime.started,paused:tempTime.paused,project:tempTime.projectName}); // Return the saved tempTime
            }
        }
        catch (err) {
            console.error("Error in getTime:", err.message);
            res.status(400).json({ message: err.message });
        }
        };


        export const pauseResumeTimer = async (req, res) => {
            // console.log("pause / resume request recieved ",req.body);
            try {
                
                if(req.body.paused===true){
                    const tempTime = await TempTimeModel.findOneAndUpdate
                    ({ userId: req.body.userId, date:req.body.date},{paused:req.body.paused,pausedAt:req.body.pausedAt},{new:true});            
                    // console.log("timer Paused", tempTime);
                    res.status(200).json(tempTime);
                }else{
                    const tempTime = await TempTimeModel.findOneAndUpdate
                    ({ userId: req.body.userId, date:req.body.date},{paused:req.body.paused},{new:true});
                    tempTime.breakTime = tempTime.breakTime + Date.now()-tempTime.pausedAt;
                    await tempTime.save();
                    // console.log("timer Resume", tempTime);
                    res.status(200).json(tempTime);
                }
                 // Return the saved tempTime
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
                timeSheet: [{ date: req.body.date, 
                    // time: req.body.elapsedTime,
                    projectsHours: [{
                        projectName: tempTime.projectName, 
                        time: req.body.elapsedTime
                    }]
                 }]
            });
        }else {
            let dateFound = false; // Flag to track if the date already exists
        
            // Use .map() to update existing entry if the date matches
            timeSheet.timeSheet = timeSheet.timeSheet.map(entry => {
                if (entry.date === req.body.date) {
                    dateFound = true;
        
                    // Check if the project exists in the projectsHours array
                    let projectFound = false;
        
                    // Update project time if project exists
                    const updatedProjectsHours = entry.projectsHours.map(project => {
                        if (project.projectName === tempTime.projectName) {
                            projectFound = true;
                            return { ...project, time: project.time + req.body.elapsedTime };
                        }
                        return project;
                    });
                    // If project does not exist, add a new project entry
                    if (!projectFound) {
                        updatedProjectsHours.push({
                            projectName: tempTime.projectName,
                            time: req.body.elapsedTime
                        });
                    }
        
                    return { ...entry,  projectsHours: updatedProjectsHours };
                }
                return entry;
            });
        
            // If date was not found, append a new entry with the project
            if (!dateFound) {
                timeSheet.timeSheet.push({
                    date: req.body.date,
                    // time: req.body.elapsedTime,
                    projectsHours: [{
                        projectName: tempTime.projectName,
                        time: req.body.elapsedTime
                    }]
                });
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

// In your timeController.js
// Updated endpoint: GET /api/fetchTime/:userId
export const fetchTimeEntries = async (req, res) => {
  try {
    const userId  = req.params.userId; // Get userId from URL parameters
    // Find the timesheet document for that specific user
    const timeSheetDoc = await TimeSheetModel.findOne({ userId });
    if (!timeSheetDoc) {
      return res.status(404).json({ message: "No timesheet found for this user." });
    }

    // Return the flattened timeSheet array (if you want to work directly with entries)
    res.status(200).json(timeSheetDoc.timeSheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//Fetching all the timesheet for the pending projects with user details



export const getPendingTimeSheets = async (req, res) => {
    try {
        const { projectName } = req.body;

        if (!projectName) {
            return res.status(400).json({ error: "Project name is required" });
        }

        const timesheets = await TimeSheetModel.find({
            "timeSheet.projectsHours": { 
                $elemMatch: { projectName: projectName } 
            }
        }).populate("userId", "name email"); // Populate user details
        

        if (!timesheets.length) {
            return res.status(404).json({ message: "No pending timesheets found for this project" });
        }

        // Filter only pending timesheets (assuming a `status: "pending"` exists in each entry)
        const pendingTimeSheets = timesheets.map((timesheet) => ({
            userName: timesheet.userId.name,
            email: timesheet.userId.email,
            timeSheet: timesheet.timeSheet.filter(ts =>
                ts.projectsHours.some(ph => ph.projectName === projectName)
            ),
        }));

        res.status(200).json({ pendingTimeSheets });

    } catch (error) {
        console.error("Error fetching pending timesheets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// fetching all the timesheets on project input

export const getTimesheetsByProject = async (req, res) => {
    try {
        const { projectName } = req.body; // Extract project name from request body

        if (!projectName) {
            return res.status(400).json({ message: "Project name is required." });
        }

        // Find timesheets where the project exists
        const timesheets = await TimeSheetModel.find({
            "timeSheet.projectsHours.projectName": projectName
        }).populate("userId", "name email"); // Populate user details (name, email)

        if (!timesheets.length) {
            return res.status(404).json({ message: "No timesheets found for this project." });
        }

        // ✅ Filter timesheet to include only relevant project entries
        const response = timesheets.map(timesheet => {
            return {
                user: {
                    id: timesheet.userId._id,
                    name: timesheet.userId.name,
                    email: timesheet.userId.email
                },
                timeSheet: timesheet.timeSheet
                    .map(entry => ({
                        date: entry.date,
                        projectsHours: entry.projectsHours.filter(project => project.projectName === projectName)
                    }))
                    .filter(entry => entry.projectsHours.length > 0) // Remove empty entries
            };
        });

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
