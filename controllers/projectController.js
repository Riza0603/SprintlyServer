import ProjectModel from "../models/Projects.js";
import UserModel from "../models/User.js";

export const createProject = async (req, res) => {
  const { pname, pdescription,projectCreatedBy, pstart, pend,members } = req.body;

  if (!pname || !pdescription || !pstart || !pend) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // Check if a project with the same name already exists 
    const existingProject = await ProjectModel.findOne({ pname });
    if (existingProject) {
      return res.status(400).json({
        message: "Project with the same name already exists",
      });
    }
   
    console.log(projectCreatedBy)
    const project = await ProjectModel.create({ pname, pdescription,projectCreatedBy, pstart, pend , members});

    //add project to user table
    await Promise.all(
      members.map(async (memberId) => {
        await UserModel.findByIdAndUpdate(
          memberId,
          { $addToSet: { projects: pname } }, 
          { new: true }
        );
      })
    );

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      message: "Error creating project",
      error: error.message,
    });
  }
};

//fetches the projects
export const fetchProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find();
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error in fetchProjects:", err.message);
    res.status(500).json({ message: err.message });
  }
};




// Update global notification settings
export const updateGlobalSettings = async (req, res) => {
  const { notifyInApp, notifyEmail } = req.body;

  try {
    // Update all projects' settings in bulk
    await ProjectModel.updateMany({}, { notifyinApp: notifyInApp, notifyemail: notifyEmail });

    return res.status(200).json({
      message: "Global settings updated successfully",
      notifyInApp,
      notifyEmail,
    });
  } catch (error) {
    console.error("Error updating global settings:", error);
    return res.status(500).json({
      message: "Error updating global settings",
      error: error.message,
    });
  }
};

// Update notification settings for a specific project
export const updateProjectSettings = async (req, res) => {
  const { projectId } = req.params;
  const { notifyInApp, notifyEmail } = req.body;

  try {
    const updatedProject = await ProjectModel.findByIdAndUpdate(
      projectId,
      { notifyinApp: notifyInApp, notifyemail: notifyEmail },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({
      message: "Project settings updated successfully",
      updatedProject,
    });
  } catch (error) {
    console.error("Error updating project settings:", error);
    return res.status(500).json({
      message: "Error updating project settings",
      error: error.message,
    });
  }
};

//get members
export const getMembers=async(req,res)=>{
  try{
    const projName=req.params.projectName;
    const members=await UserModel.find({projects:projName})
    
    res.status(200).json(members)
  }catch(error){
    console.log("error in getMembers",error.message)
    res.status(500).json({ message: error.message });
  }
}

//delete member from specific project
export const deleteMember= async (req,res)=>{
  try{
    const memberId=req.params.memberId;
    const { projectName } = req.body;
    const updateProject = await ProjectModel.findOneAndUpdate(
      { pname: projectName }, 
      { $pull: { members: memberId } },
      { new: true } 
    );

    if (!updateProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    const updateMember= await UserModel.findOneAndUpdate({"_id":memberId},
      { $pull: { projects: projectName } }, 
    );
    if(!updateMember){
      return res.status(404).json({ message: "Member not found in project" });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  }catch(err){
    res.status(500).json({ message: "Error deleting member", err });
  }
}

//add members to project
export const addMember=async (req,res)=>{
  try{
    const {_id,projectName,position}=req.body;
    const project= await ProjectModel.findOneAndUpdate({pname:projectName},
      {$addToSet:{members:_id},
    new:true
  }
      
      
    );
    if(!project){
      return res.status(404).json({message:"proj failed"})
    }

    const member= await UserModel.findByIdAndUpdate(_id,{
      $addToSet:{projects:projectName},
      role:position},
      { new: true });
    res.status(200).json(member)
  }catch(err){
    res.status(500).json({ message: 'Error adding member', error: err });
  }
}

//delete from both user and project table
export const deleteUser= async (req,res)=>{
  try{
    const memberId=req.params.memberId;
    const updateProject= await ProjectModel.findOneAndUpdate({"members._id":memberId},
      {$pull:{members:{_id:memberId}}},
    );

    const updateUser = await UserModel.findByIdAndDelete(memberId);
    if(!updateProject){
      return res.status(404).json({ message: "Member not found in project",  });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  }catch(err){
    res.status(500).json({ message: "Error deleting member", err });
  }
}


