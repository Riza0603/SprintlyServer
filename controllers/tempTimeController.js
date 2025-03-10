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
        res.status(400).json({ message: err.message });
    }
    };

   
    export const getTime = async (req, res) => {
        console.log("req recieved ",req.body.date);
        try {
            const tempTime = await TempTimeModel.findOne
            ({ userId: req.body.userId, date:req.body.date});
            if(tempTime){

           
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
        res.status(400).json({ message: err.message });
    }
    }


    export const fetchTimeEntries = async (req, res) => {
        try {
          const userId = req.params.userId;
          const timeSheetDoc = await TimeSheetModel.findOne({ userId });
      
          if (!timeSheetDoc) {
            return res.status(404).json({ message: "No timesheet found for this user." });
          }
          const timeEntries = [];
          timeSheetDoc.timeSheet.forEach(sheet => {
            sheet.projectsHours.forEach(prjHr => {
              timeEntries.push({
                projectName: prjHr.projectName,
                date: sheet.date,
                time: prjHr.time,
                comment: prjHr.comment || "No Comments",
                status: prjHr.status || "Pending"
            
              });
            });
          });
      
          res.status(200).json(timeEntries);
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
              for(const prjHr of sheet.projectsHours){
                result.push({
                    userId: entry.userId,
                    userName,
                    date: sheet.date,
                    projectName: prjHr.projectName,
                    projectHoursId:prjHr._id,
                    time: prjHr.time,
                    status: prjHr.status,
                    comment: prjHr.comment
                });
            }
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
        const { userId, projectHoursId, status, comments } = req.body;
        console.log(userId, projectHoursId, status, comments )
        // Find the specific user and update the project inside any timeSheet entry
        const updatedEntry = await TimeSheetModel.findOneAndUpdate(
            { userId, "timeSheet.projectsHours._id": projectHoursId },
            { 
                $set: { 
                    "timeSheet.$[].projectsHours.$[inner].status": status,
                    "timeSheet.$[].projectsHours.$[inner].comment": comments 
                }
            },
            {
                new: true,
                arrayFilters: [
                    { "inner._id": projectHoursId }
                ]
            }
        );
        if (!updatedEntry) {
            return res.status(404).json({ message: "Project entry not found" });
        }
        res.status(200).json(updatedEntry);
    } catch (err) {
        console.error("Error updating timesheet:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
  };
  