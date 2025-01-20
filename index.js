const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users.js")

const app = express()
app.use(express.json())
app.use(cors())

try{
    mongoose.connect("mongodb://127.0.0.1:27017/Sprintly")
    console.log("connected to mongodb database")
}catch(error){
    console.log("error connecting to database"+ error)
}

app.post("/signup",(req,res)=>{
    UserModel.create(req.body).then(u=>res.json(u)).catch(e=>res.json(e))
})


app.post("/login", async (req, res) => {
    try {
        console.log("received");
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.json({ message: "No such user! Please Sign up." });
        }

        const passwordIsValid = await argon2.verify(user.password, password);

        if (passwordIsValid) {
            console.log("Login successful");
            return res.json({ message: "Login Successful", user });
        } else {
            console.log("Password mismatch!");
            return res.json({ message: "Invalid Password" });
        }
    } catch (error) {
        console.log("Error during login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



app.listen(3002,()=>{console.log("Server has started")})