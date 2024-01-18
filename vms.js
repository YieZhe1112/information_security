const express = require('express')
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const rateLimitMiddleware = require("./rateLimiter")
const app = express()
const port = process.env.PORT || 3000;
const swaggerUi = require ("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "MyVMS API",
            version: "1.0.0",
        },
    },
    apis: ["./vms.js"],		//depends on your swagger command file
};

const swaggerSpec = swaggerJsdoc (options)

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use("/api-docs", swaggerUi.serve,swaggerUi.setup(swaggerSpec));	//localhost behind add this /api-docs
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
    
 })


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://s2s3a:abc1234@record.55pqast.mongodb.net/?retryWrites=true&w=majority";

//global variables  
var name
var role = 'null'

var jwt_token
var cookie
var t

var strength
var tips

function checkPasswordStrength(password) {
    strength = 0
    // Check password length
    if (password.length < 8) {
      //tips += "Make the password longer. ";
    } else {
      strength += 1;
    }
  
    // Check for mixed case
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
      strength += 1;
    } else {
      //tips += "Use both lowercase and uppercase letters. ";
    }
  
    // Check for numbers
    if (password.match(/\d/)) {
      strength += 1;
    } else {
      //tips += "Include at least one number. ";
    }
  
    // Check for special characters
    if (password.match(/[^a-zA-Z\d]/)) {
      strength += 1;
    } else {
      //tips += "Include at least one special character. ";
    }

    if(strength > 3){
    }
    else{
        return tips
    }
}
function create_jwt (payload){
    jwt_token = jwt.sign(payload, 'super_secret');
    return 
}

function getcookie(req) {
    var c = req.cookies.ssesid
    return c
}

function verifyToken (req, res, next){
    var token = req.cookies.ssesid

    if (!token){
        role = " "
        return next()
    }
        
    const user = jwt.verify (token, 'super_secret', (err,user) => {
        if (err){
            role = " "
            return next()
        }
        
        req.user = user
        name = user.username
        role = user. role
        // if(user.role == "security"){
        //     Security = user.username
        //     role = user.role
        //     console.log(user.username)
        //     console.log(user.role)
        // }
        // else if(user.role == "host"){
        //     Host = user.username
        //     role = user.role
        //     console.log(user.username)
        //     console.log(user.role)
        // }
        // else if(user.role == "admin"){
        //     Admin = user.username
        //     role = user.role
        //     console.log(user.username)
        //     console.log(user.role)
        // }
        return next()
    });
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect().then(res=>{
    if (res){
        
        console.log("Welcome to visitor managment system")
    }
})

var status
async function login(Username,Password){  //user and host login

    const option={projection:{password:0,host:0,visitor:0, admin:0}}  //pipeline to project usernamne and email

    const result = await client.db("user").collection("host").findOne({
        $and:[
            {username:{$eq:Username}},
            {password:{$eq:Password}}
            ]
        },option)
        //console.log(status)

        if(result ){
            if (result.status == "pending"){
                t = 'e'
                return "Please wait for security to approve"

            }
            else{
                t = 's'
                //Host = result.username
                //console.log(result)
                //console.log("Successfully Login")
                //role = "host"
                create_jwt (result)
                status = result.status
                return result
            }
            
    }
        else {
            const option={projection:{password:0,host:0,visitor:0,admin:0}}  //pipeline to project usernamne and email

            const result = await client.db("user").collection("security").findOne({
                $and:[
                    {username:{$eq:Username}},
                    {password:{$eq:Password}}
                    ]
            },option)

            if(result){
                t = 's'
                //Security = result.username
                //console.log(result)
                //console.log("Successfully Login")
                //role = "security"
                create_jwt (result)
                return result
                
                
        }
        
         //status = result.status
            else{
                t = 'e'
                return "User not found or password error"
                //("User not found or password error"
                
        }
    } 
}

async function updateRole(Username,Password){  //user and host login

    //const option={projection:{password:0,host:0,visitor:0, admin:0}}  //pipeline to project usernamne and email

    const result = await client.db("user").collection("host").findOne({
        $and:[
            {username:{$eq:Username}},
            {_id:{$eq:Password}}
            ]
        })
        //console.log(status)

        if(result ){
            await client.db("user").collection("security").insertOne({
                "_id":result._id,
                "username":result.username,
                "password":result.password,
                "email":result.email,
                "role":"security"
            })
            await client.db("user").collection("host").deleteOne({
                $and:[
                    {username:{$eq:Username}},
                    {_id:{$eq:Password}}
                    ]
            })
            return "Role succesfully updated"

            
            
    }
        else {
            //const option={projection:{password:0,host:0,visitor:0,admin:0}}  //pipeline to project usernamne and email

            const result = await client.db("user").collection("security").findOne({
                $and:[
                    {username:{$eq:Username}},
                    {_id:{$eq:Password}}
                    ]
            })

            if(result){
                await client.db("user").collection("host").insertOne({
                    "_id":result._id,
                    "host":result.username,
                    "username":result.username,
                    "password":result.password,
                    "email":result.email,
                    "status":"approve",
                    "role":"host"
                })
                await client.db("user").collection("security").deleteOne({
                    $and:[
                        {username:{$eq:Username}},
                        {_id:{$eq:Password}}
                        ]
                })
                return "Role succesfully updated"
        }
        
         //status = result.status
            else{
                
                return "User not found or id error"
                //("User not found or password error"
                
        }
    } 
}

var lock =0
var LOCK = false

async function admin(Username,ID,Password){  

    if(LOCK==false){
        //const option={projection:{password:0,host:0,role:0,visitor:0}}  //pipeline to project usernamne and email   
        const result1 = await client.db("user").collection("admin").findOne(
            {username:{$eq:Username}
        })
        

        //console.log(result1)

        if(lock <2 && result1 ){
            console.log(result1.status)
            if(result1.status == "false"){
                return "Your account has been lock. \nPlease contact security to activate the account"
            }

            else{
                const result = await client.db("user").collection("admin").findOne({
                    $and:[
                        {username:{$eq:Username}},
                        {_id:{$eq:ID}},
                        {password:{$eq:Password}}
                        ]
                    })
            
                    if(result){
                        lock=0
                        t = 's'
                        //role = "admin"
                        //Admin = result.username
                        create_jwt (result)
                        const result2 = await client.db("user").collection("host").find().toArray()
                        return result2  
                    }
                    else{
                        t = 'e'
                        lock ++
                        //("User not found or password error")
                        return "User not found or password error"
                    }
            }
        }
        else{
            LOCK = true
            await client.db("user").collection("admin").updateOne({
            username:Username
            },{$set:{status:"false"}})

            while(LOCK){
                setTimeout(function(){LOCK = false},300000)
                lock = 0
                return "The attempt limit exceed. \nPlease wait for 5 minutes before retry."
            }
            
        }
    }
}

async function approveRegister(Username,ID){  
    result = await client.db("user").collection("host").findOne ({
        $and:[
        {username:{$eq:Username}},
        {_id:{$eq:ID}}
        ]
    })
    //console.log(result)

    if (result){
        await client.db("user").collection("host").updateOne({
            username: Username
        },{$set:{status:"approve"}})

        return "Account successfully activated"
    }
    else{
        return "Account not found"
    }
}

async function activateAdmin(Username,ID){  
    result = await client.db("user").collection("admin").findOne ({
        $and:[
        {username:{$eq:Username}},
        {_id:{$eq:ID}}
        ]
    })
    //console.log(result)

    if (result){
        await client.db("user").collection("admin").updateOne({
            username: Username
        },{$set:{status:"true"}})
        lock =0
        LOCK = false
    }
}

async function registerHost(regIC,regUsername,regPassword,regEmail,regPhone){  //register host
    checkPasswordStrength(regPassword)

    if(strength > 3){
        if (await client.db("user").collection("host").findOne({_id : regIC})){
            return "Your IC has already registered in the system"
        }
        
        else {
            if( await client.db("user").collection("host").findOne({username: regUsername})){
                return "Your Username already exist. \n Please try to login"
            }

            else if(await client.db("user").collection("host").findOne({email: regEmail})){
                return "Your email already exist. \n Please try to login"
            }

            else{
                await client.db("user").collection("host").insertOne({
                    "_id":regIC,
                    "host":regUsername,
                    "username":regUsername,
                    "password":regPassword,
                    "email":regEmail,
                    "phone":regPhone,
                    "status":"pending",
                    "role":"host"
                })
                let data = regUsername + " is successfully register please wait for security to approve"
                return data
            }
        }
    }
    else{
        return "1. Make the password longer. \n" + "2. Use both lowercase and uppercase letters. \n" + "3. Include at least one number. \n" + "4. Include at least one special character. "
    }
}

async function registerTestHost(regIC,regUsername,regPassword,regEmail,regPhone){  //register host
    
    checkPasswordStrength(regPassword)
    
    if(strength > 3){
        if (await client.db("user").collection("host").findOne({_id : regIC})){
            return "Your IC has already registered in the system"
        }
        
        else {
            if( await client.db("user").collection("host").findOne({username: regUsername})){
                return "Your Username already exist. \n Please try to login"
            }

            else if(await client.db("user").collection("host").findOne({email: regEmail})){
                return "Your email already exist. \n Please try to login"
            }

            else{
                await client.db("user").collection("host").insertOne({
                    "_id":regIC,
                    "host":regUsername,
                    "username":regUsername,
                    "password":regPassword,
                    "email":regEmail,
                    "phone":regPhone,
                    "status":"approve",
                    "role":"host"
                })
                let data = regUsername + " is successfully register"
                return data
            }
        }
    }
    else{
        return "1. Make the password longer. \n" + "2. Use both lowercase and uppercase letters. \n" + "3. Include at least one number. \n" + "4. Include at least one special character. "
    }
}

async function deleteVisitorAcc(Username){  //delete visitor acc
    const result = await client.db("user").collection("visitor").deleteOne({
        username:{$eq:Username}
    })

    await client.db("user").collection("host").updateMany({
     
    },{$pull:{visitor:{name:Username}}},{upsert:true})

    if(result.deletedCount == 1){
        //console.log(result)
        return "The account was successfully deleted"
    }
    else{
        return "The account you was tried to delete doesn't exist"
    }
}

async function deleteHostAcc(Username){  //delete host acc
    const result = await client.db("user").collection("host").deleteOne({
        username:{$eq:Username}
    })

    await client.db("user").collection("visitor").updateMany({
        
    },{$pull:{host:{name:Username}}},{upsert:true})

    if(result.deletedCount == 1){   //if the acc exists, delete the acc
        //console.log(result)
        return "The account was successfully deleted"
    }
    else{   
        return "The account you was tried to delete doesn't exist"
    }
}


async function addVisitor(_id,visitorName,phoneNumber,companyName,date,time){
    //to check whether there is same visitor in array
    //console.log(host)
    // let filter = await client.db("user").collection("host").findOne({
    //     username:{$eq:host}
    // })
    let result = await client.db("user").collection("host").findOne({
        // visitor:{$elemMatch:{_id}}},
        $and:[
            {username:{$eq:name}},
            {visitor:{$elemMatch:{_id}}},
            {visitor:{$elemMatch:{date}}},
            {visitor:{$elemMatch:{time}}}
            ]
    
        })
    
    if (result){
        //console.log ("The visitor you entered already in list or time is occupied")
        //console.log (result)
        return "The visitor you entered already in list or time is occupied"
    }
    else{
        await client.db("user").collection("host").updateOne({
            username:{$eq:name}
        },{
            $push:{visitor:{_id:_id,name:visitorName,phone:phoneNumber,company:companyName,date:date,time:time}}},{upsert:true})
        //console.log("The visitor is added successfully")
        //console.log(Host)
        return "The visitor is added successfully"
    }
}

async function removeVisitor(_id,date,time){

    let result = await client.db("user").collection("host").findOne({
        $and:[
            {host:{$eq:name}},
            {visitor:{$elemMatch:{_id}}},
            {visitor:{$elemMatch:{date}}},
            {visitor:{$elemMatch:{time}}}
            ]
    })
    //console.log(result)

    if(result){
        await client.db("user").collection("host").updateOne({
            $and:[
                {host:{$eq:name}},
                {visitor:{$elemMatch:{_id}}},
                {visitor:{$elemMatch:{date}}},
                {visitor:{$elemMatch:{time}}}
                ]
        },{
            $pull:{visitor:{_id:_id},visitor:{time:time},visitor:{date:date}}},{upsert:true})

        return "Successfully remove visitor"
    }
    else{
        return "Visitor not found"
    }
}

async function phone(Username){
    

    let result = await client.db("user").collection("host").findOne({
        $and:[
            {host:{$eq:Username}},
            {visitor:{$ne:[]}}
        ]
        
    })
    //console.log(result)

    if(result){
        return result.phone
    }
    else{
        return "There is no visitor for the host. \nYou are not allow to review the host's contact."
    }
}

async function searchVisitor(username){
    //const option={projection:{password:0,role:0}}  //pipeline to project usernamne and email
    const option={projection:{_id:0,username:0,password:0,email:0,role:0,host:0,phone:0,status:0}}

    const result = await client.db("user").collection("host").findOne({
        $and:[
            {host:{$eq:name}},
            {username:{$eq:username}}
            ]
    },option)

    if(result){
        //console.log(result)
        const result2 = await client.db("user").collection("host").find({},option).toArray()
        return result
    }
    else{
        return "You are not allow to see other host's visitors"
    }
    
}

async function retrivepass(username,_id,date,time){
    const result = await client.db("user").collection("host").findOne({
        $and:[
            {host:{$eq:username}},
            {visitor:{$elemMatch:{_id}}},
            {visitor:{$elemMatch:{date}}},
            {visitor:{$elemMatch:{time}}}
            ]
    })

    if(result){
        await client.db("user").collection("host").updateOne({
            $and:[
                {host:{$eq:username}},
                {visitor:{$elemMatch:{_id}}},
                {visitor:{$elemMatch:{date}}},
                {visitor:{$elemMatch:{time}}}
                ]
        },{
            $pull:{visitor:{_id:_id},visitor:{time:time},visitor:{date:date}}},{upsert:true})

        //console.log("Successfully retrive pass")
        return "Successfully retrive pass \n" + "Host: " + username + "\n" + "Time: " + time
        // console.log("Pass already retrived or not in the list")
        // return "Pass already retrived or not in the lits"
    }
    else{
        //console.log("Pass already retrived or not in the list")
        return "Pass already retrived or not in the lits"
        // console.log("Successfully retrive pass")
        // return "Successfully retrive pass"
    }
}

//HTTP login method
app.post('/login', rateLimitMiddleware, async(req, res) => {   //login
    cookie = getcookie(req);
    let resp = await login(req.body.username,req.body.password)
    if(cookie == null){
        if(t == 's'){
            res.cookie("ssesid", jwt_token, {httpOnly: true}).send(resp)

        }
        else{
            res.send(resp)
        }
    }
    else{
        res.send("You had login as another account. Please log out")
    }
    res.end()
})

//Test
app.post("/test/register/host" , verifyToken, async(req, res) => {  //register test host
    res.send(await registerTestHost(req.body._id,req.body.username,req.body.password,req.body.email,req.body.phone))
})

//host HTTP methods    
app.post('/login/host/search',verifyToken, async(req, res) => {   //look up visitor details
    //console.log(req.cookies.ssesid)
    if ((role == "host")){
        let resp = await searchVisitor(req.body.host)
        res.send (resp)
    }
    else
        res.send ("Please log in")
})

app.post('/login/host/addVisitor',verifyToken, async (req, res) => {   //add visitor
    if ((role == "host")){
        let response = await addVisitor(req.body._id,req.body.visitorName,req.body.phoneNumber,req.body.companyName,req.body.date,req.body.time)
        res.send (response)
    }
    else
        res.send ("Please log in")
        //console.log (" ")
})

app.post('/login/host/removeVisitor',verifyToken, async (req, res) => {   //remove visitor
    if ((role == "host")){
        let response = await removeVisitor(req.body._id,req.body.date,req.body.time)
        res.send (response)
    }
    else
        res.send ("Please log in")
       //console.log (" ")
})
    
//security http mehtods    
app.post("/login/security/activateAdmin" , verifyToken, async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await activateAdmin(req.body.username,req.body._id))
    else
        res.send ("Please log in")
})

app.post("/login/security/approveHost" , verifyToken, async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await approveRegister(req.body.username,req.body._id))
    else
        res.send ("Please log in")
})

app.post("/login/security/deleteHost" , verifyToken, async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await deleteHostAcc(req.body.username))
    else
        res.send ("Please log in")
})

app.post("/login/security/deleteVisitor" , verifyToken, async(req, res) => {  //delete visitor
    if ((role == "security"))
        res.send(await deleteVisitorAcc(req.body.username))
    else
        res.send ("Please log in")
})

app.post("/login/security/register/visitor" , verifyToken, async (req, res) => {  //register visitor
    if ((role == "security"))
        res.send(await registerVisitor(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role,req.body.lastCheckinTime))
    else
        res.send ("Please log in")
})

app.post("/login/security/retrivePhone" , verifyToken, async (req, res) => {  //register visitor
    if ((role == "security"))
        res.send(await phone(req.body.username))
    else
        res.send ("Please log in")
})
        
app.post("/register" , async(req, res) => {  //register host
    res.send(await registerHost(req.body._id,req.body.username,req.body.password,req.body.email,req.body.phone))     
})

app.get('/logout', (req, res) => {
    role = "null"
    delete jwt_token
    delete cookie
    res.clearCookie("ssesid").send("You have log out")
})

app.post('/visitorRetrivePass', async(req, res) => {   //retrive pass
    res.send(await retrivepass(req.body.host,req.body._id,req.body.date,req.body.time))
})

app.post('/login/admin', async(req, res) => {   //retrive pass
    cookie = getcookie(req);
    let resp = await admin(req.body.username,req.body._id,req.body.password)
    if(cookie == null){
        if(t == 's'){
            res.cookie("ssesid", jwt_token, {httpOnly: true}).send(resp)

        }
        else{
            res.send(resp)
        }
    }
    else{
        res.send("You had login as another account. Please log out")
    }
    res.end()
})

app.post('/login/admin/updateRole',verifyToken, async(req, res) => {   //retrive pass
    if (role == 'admin'){
        res.send(await updateRole(req.body.username,req.body._id))
    }
    else{
        res.send("Please log in")
    }
    
})

/**
 * @swagger
 *  /login:
 *    post:
 *      tags:
 *      - User
 *      description: User login
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/admin:
 *    post:
 *      tags:
 *      - Admin
 *      description: Admin login
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                _id:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/admin/updateRole:
 *    post:
 *      tags:
 *      - Admin
 *      description: Role update
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                _id:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /visitorRetrivePass:
 *    post:
 *      tags:
 *      - Visitor
 *      description: Visitor retrive pass
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                host:
 *                  type: string
 *                _id:
 *                  type: string
 *                date:
 *                  type: string
 *                time:
 *                  type: string
 * 
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/host/search:
 *    post:
 *      tags:
 *      - Host
 *      description: Search visitor
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                host:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/host/addVisitor:
 *    post:
 *      tags:
 *      - Host
 *      description: Add visitor
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                _id:
 *                  type: string
 *                visitorName:
 *                  type: string
 *                phoneNumber:
 *                  type: string
 *                companyName:
 *                  type: string
 *                date:
 *                  type: string
 *                time:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /test/register/host:
 *    post:
 *      tags:
 *      - Test
 *      description: Register host
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                password:
 *                  type: string
 *                _id:
 *                  type: string
 *                email:
 *                  type: string
 *                phone:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/host/removeVisitor:
 *    post:
 *      tags:
 *      - Host
 *      description: Add visitor
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                _id:
 *                  type: string
 *                date:
 *                  type: string
 *                time:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/activateAdmin:
 *    post:
 *      tags:
 *      - Security
 *      description: Activate admin
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                _id:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/approveHost:
 *    post:
 *      tags:
 *      - Security
 *      description: Approve host
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                _id:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/retrivePhone:
 *    post:
 *      tags:
 *      - Security
 *      description: Retrive phone
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /register:
 *    post:
 *      tags:
 *      - User
 *      description: Register host
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                password:
 *                  type: string
 *                _id:
 *                  type: string
 *                email:
 *                  type: string
 *                phone:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/deleteHost:
 *    post:
 *      tags:
 *      - Security
 *      description: Delete host
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /logout:
 *    get:
 *      tags:
 *      - Logout
 *      description: Logout
 *      responses:
 *        200:
 *          description: OK
 */

// async function updateVisitorPass(regPassword){  //change only when password is different
//     result = await client.db("user").collection("visitor").findOne ({username:{$eq:visitor}})

//     if (result.password != regPassword){
//         await client.db("user").collection("visitor").updateOne({
//             username:{$eq:visitor}
//         },{$set:{password:regPassword}})

//         let data = "Password "+visitor+" is successfully updated"
//         return data
//     }
//     else
//         return "Same password cannot be applied"
// }        

// async function updateHostPass(regPassword){

//     result = await client.db("user").collection("host").findOne ({username:{$eq:host}})

//     if (result.password != regPassword){
//         await client.db("user").collection("host").updateOne({
//             username:{$eq:host}
//         },{$set:{password:regPassword}})

//         let data= "Password "+host+" is successfully updated"
//         return data
//     }
//     else
//         return "Same password cannot be applied"
// }

// async function updateSecurityPass(regPassword){

//     result = await client.db("user").collection("security").findOne ({username:{$eq:security}})

//     if (result.password != regPassword){
//         await client.db("user").collection("security").updateOne({
//             username:{$eq:security}
//         },{$set:{password:regPassword}})

//         let data= "Password "+security+" is successfully updated"
//         return data
//     }
//     else
//         return "Same password cannot be applied"
// }

// app.post('/login/visitor', async(req, res) => {   //login
//     res.send(await login(req.body.username,req.body.password))
// })

// app.post('/login/visitor/updatePassword', async(req, res) => {   //login
//     console.log(role)
//     if ((role == "visitor")){
//         res.send (await updateVisitorPass(req.body.password))
//     }
//     else
//         res.send ("You are not a visitor")
//         console.log ("You are not a visitor")
// })

// app.get('/login/visitor/logout', (req, res) => {
//     if ((role == "visitor")){
//         role = "NULL"
//         res.clearCookie("ssesid").send("You have log out")
//     }
//     else
//         res.send ("You had log out")
//         console.log ("You had log out")
// })
    
// app.post('/login/host', async(req, res) => {   //login  
//     res.send(await login(req.body.username,req.body.password))
// })

// app.post('/login/host/updatePassword', async(req, res) => {   //login
//     if ((role == "host")){
//         res.send(await updateHostPass(req.body.password))
//     }
//     else
//         res.send ("You are not a host") 
// })

// app.get('/login/host/logout', (req, res) => { 
//     if ((role == "host")){
//         role = "NULL"
//         res.clearCookie("ssesid").send("You have log out")
//     }
//     else
//         res.send ("You had log out")
//         console.log ("You had log out")
// })

// app.post('/login/security/updatePassword', async(req, res) => {   //login
//     if ((role == "security")){
//         res.send(await updateSecurityPass(req.body.password))
//     }
//     else
//         res.send ("You are not a security") 
// })

// app.get('/login/security/logout', (req, res) => {
//     if ((role == "security")){
//         role = "NULL"
//         res.clearCookie("ssesid").send("You have log out")
//     }
//     else
//         res.send ("You had log out")
//         console.log ("You had log out")
// })