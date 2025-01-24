const mongoose =require('mongoose')


const ProjectSchema =new mongoose.Schema({
    pname: String,
    pdescription: String,
    pstart: Date,
    pend: Date
})

const ProjectModel = mongoose.model("Projects", ProjectSchema)
module.exports = ProjectModel