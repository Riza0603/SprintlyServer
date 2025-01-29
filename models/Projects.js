const mongoose =require('mongoose')


const ProjectSchema =new mongoose.Schema({
    pname: String,
    pdescription: String,
    pstart: Date,
    pend: Date,
    pstatus:{ type: String, default: "In-Progress" },
})

const ProjectModel = mongoose.model("Projects", ProjectSchema)
module.exports = ProjectModel