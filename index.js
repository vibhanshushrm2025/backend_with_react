import express from "express";
import path from "path";

import cookieParser from "cookie-parser";// used for reading cookie from req and sending cookie from res.cookie . also include app.use()
import jwt from "jsonwebtoken"; // name ,email and password are set into the mongodb and corresponding _id is generated , then 
                                // that id is loaded into the cookie of webpage , but to encrypt that cookie , we have to 
                                // convert that into jwt and then store it . After that when we need the _id from the cookie , 
                                // we decrypt the jwt 
import bcrypt from "bcrypt"; // Putting the original password in mongodb is also dangerous , so we bcrypt it and save the bcrypted password
                            // even in mongodb . To check we just use the brycpt.compare() function

// Below are the four lines that are used to import,connect,schema define , mdl making in mongodb
// Use them in any project , they will work
import mongoose from "mongoose";
mongoose
  .connect(
    "mongodb+srv://vibhanshu03:vibhanshu03@cluster0.v8llplh.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {cookie
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

const messagSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const mdl = mongoose.model("applicant", messagSchema);
// After the above 4 steps , we can use different functions on "mdl" like mdl.findOne(json) , mdl.create(json) , mdl.findbyId(user._id)


const app = express();
app.use(express.static(path.join(path.resolve(), "public")));// 
app.use(express.urlencoded({ extended: true }));// for allowing to read req.body
app.use(cookieParser());
app.set("view engine", "ejs");
// app.get('/add',(req,res)=>{
//     mdl.create({name:"hello",email:"6packProgrammer"}).then(()=>{
//         res.send("nice");
//     })
// })
// app.post('/add',async (req,res)=>{
//     console.log("sfljs;");
//     console.log(req.body.email);
//     await mdl.create(req.body).then(()=>{
//         res.redirect('/');
//     })
// })


// When you hit the /login endpoint through the post request , then first it will check if the user exists or not ,
// if user doesn't exists , it 
app.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const user = await mdl.findOne({ email: email });// finding does user exists on mongodb
  if (!user) return res.render("register",{message:"that user doesnot exits, please register"});// if user don't exists , then redirect to register and RETURN
  console.log(password,"   ",user.password, " hello");
  const tof = await bcrypt.compare(password,user.password);// if user exists ,then compare the passwords , 
  console.log(tof,"bool");
  if (tof) {// if user exists , then make arrangements of the cookie , encrypt the token , and set expiry date
    const token = jwt.sign({ _id: user._id }, ";sfjas;jf;asjf");
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 1000),
    });
    res.redirect("/");
  }
  else{// else redirect to the login page , showing incorrect password
    res.render("index",{message:"incorrect password",email:email});
  }  
});
const isLoggedIn = async (req, res, next) => { // this function will first check if the cookie is present or not 
  const token = req.cookies.token;            // and if it is present , then whether the cookie'id is correct or not
  console.log(token);
  if (token) {
    const decoded = jwt.verify(token, ";sfjas;jf;asjf");
    console.log(decoded);
    req.user = await mdl.findById(decoded._id);//set the req.user for the next() functions , so that they can use
    next(); // the next (req, res) function 
  } else {
    res.render("index", { name: "vibhanshu" });
  }
};
app.get("/", isLoggedIn, (req, res) => {
  res.render("logout", { name: req.user.name });
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const user = await mdl.findOne({ email: email });// first of all , check whether the user is present or not by searching through emails
  if (user) { // if user is found , then redirect to the login page .
    return res.render("index",{message:"that user exits , please login"});
  }
  // else you have to register the user . bcrypt the password and send it through mongodb . and make the cookie .
  const hashedPassword=await bcrypt.hash(password,10);
  const uss = await mdl.create({
    name,
    email,
    password:hashedPassword
  });
  const token = jwt.sign({ _id: uss._id }, ";sfjas;jf;asjf");
  console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 300 * 1000),
  });
  res.redirect("/");
});
app.get("/logout", async (req, res) => {// just set the expiry of cookie to be Date.now();
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.redirect("/");
});
app.listen(5000, () => {
  console.log("app is working");
});
