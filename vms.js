const express = require('express')
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
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
global.host
var role = 'null'
var Admin

var jwt_token
var cookie
var t

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
        if(user.role == "security"){
            security = user.username
            //console.log(security)
        }
        else if(user.role == "host"){
            host = user.username
            //console.log(host)
        }
        else if(user.role == "admin"){
            Admin = user.username
            //console.log(host)
        }
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

async function login(Username,Password){  //user and host login

    const option={projection:{password:0,host:0,role:0,visitor:0, admin:0}}  //pipeline to project usernamne and email

    const result = await client.db("user").collection("host").findOne({
        $and:[
            {username:{$eq:Username}},
            {password:{$eq:Password}}
            ]
        },option)

        if(result){
            t = 's'
            host = result.username
            //console.log(result)
            //console.log("Successfully Login")
            role = "host"
            create_jwt (result)
            return result
            
    }
        else {
            const option={projection:{password:0,host:0,role:0,visitor:0,admin:0}}  //pipeline to project usernamne and email

            const result = await client.db("user").collection("security").findOne({
                $and:[
                    {username:{$eq:Username}},
                    {password:{$eq:Password}}
                    ]
        },option)

            if(result){
                t = 's'
                security = result.username
                //console.log(result)
                //console.log("Successfully Login")
                role = "security"
                create_jwt (result)
                return result
                
                
        }
            else{
                t = 'e'
                //("User not found or password error")
                return "User not found or password error"
                
        }
    } 
}

var lock =0
var LOCK = false

async function admin(Username,ID,Password){  

    //const option={projection:{password:0,host:0,role:0,visitor:0}}  //pipeline to project usernamne and email   
    const result1 = await client.db("user").collection("admin").findOne(
        {status:{$eq:"true"}
    })
    //console.log(result1)

    if(lock <2 && result1){
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
                role = "admin"
                Admin = result.username
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
    else{
        LOCK = true
        await client.db("user").collection("admin").updateOne({
           username:Username
        },{$set:{status:"false"}})
        console.log(Admin)

        while(LOCK){
            return "Your account has been lock, please contact security to activate the account"
        }
    }
    lock ++
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
    }
}

async function registerVisitor(regIC,regUsername,regPassword,regEmail,regRole,regLast){  //register visitor
   
    if (await client.db("user").collection("visitor").findOne({_id : regIC})){
        return "Your IC has already registered in the system"
    }
    
    else {
        if( await client.db("user").collection("visitor").findOne({username: regUsername})){
            return "Your Username already exist. Please try to login"
        }

        else if(await client.db("user").collection("visitor").findOne({email: regEmail})){
            return "Your email already exist. Please try to login"
        }

        else{
            await client.db("user").collection("visitor").insertOne({
                "_id":regIC,
                "username":regUsername,
                "password":regPassword,
                "email":regEmail,
                "role":"visitor",
                "lastCheckinTime" :"not cehck in yet"
            })
            let data = regUsername+" is successfully register"
            return data
        }
    }
}

async function registerHost(regIC,regUsername,regPassword,regEmail,regRole){  //register host
    if (await client.db("user").collection("host").findOne({_id : regIC})){
        return "Your IC has already registered in the system"
    }
    
    else {
        if( await client.db("user").collection("host").findOne({username: regUsername})){
            return "Your Username already exist. Please try to login"
        }

        else if(await client.db("user").collection("host").findOne({email: regEmail})){
            return "Your email already exist. Please try to login"
        }

        else{
            await client.db("user").collection("host").insertOne({
                "_id":regIC,
                "host":regUsername,
                "username":regUsername,
                "password":regPassword,
                "email":regEmail,
                "role":"host"
            })
            let data = regUsername + " is successfully register"
            return data
        }
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
        await client.db("user").collection("host").updateOne({username: host},{
            $push:{visitor:{_id:_id,name:visitorName,phone:phoneNumber,company:companyName,date:date,time:time}}},{upsert:true})
        //console.log("The visitor is added successfully")
        //console.log(result)
        return "The visitor is added successfully"
    }
}

async function removeVisitor(name,date,time){

    let result = await client.db("user").collection("host").findOne({
        $and:[
            {username:{$eq:host}},
            {visitor:{$elemMatch:{name}}},
            {visitor:{$elemMatch:{date}}},
            {visitor:{$elemMatch:{time}}}
            ]
    })

    if(result){
        await client.db("user").collection("host").updateOne({
            $and:[
                {username:{$eq:host}},
                {visitor:{$elemMatch:{name}}},
                {visitor:{$elemMatch:{date}}},
                {visitor:{$elemMatch:{time}}}
                ]
        },{
            $pull:{visitor:{name:name},visitor:{time:time},visitor:{date:date}}},{upsert:true})

        return "Successfully remove visitor"
    }
    else{
        return "Visitor not found"
    }
}


async function searchVisitor(_id){
    //const option={projection:{password:0,role:0}}  //pipeline to project usernamne and email
    const option={projection:{_id:0,username:0,password:0,email:0,role:0,host:0}}

    const result = await client.db("user").collection("host").findOne({
        $and:[
            {host:{$eq:host}},
            {visitor:{$elemMatch:{_id}}}
            ]
    },option)

    if(result){
        //console.log(result)
        return result
    }
    else{
        return "No visitor found"
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
        return "Successfully retrive pass"
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
app.post('/login', async(req, res) => {   //login
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
        res.send("")
    }
    res.end()
})

//Test
app.post("/test/register/host" , verifyToken, async(req, res) => {  //register test host
    res.send(await registerHost(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role))
})

//host HTTP methods    
app.post('/login/host/search',verifyToken, async(req, res) => {   //look up visitor details
    //console.log(req.cookies.ssesid)
    if ((role == "host")){
        let resp = await searchVisitor(req.body._id)
        res.send (resp)
    }
    else
        res.send (" ")
})

app.post('/login/host/addVisitor',verifyToken, async (req, res) => {   //add visitor
    if ((role == "host")){
        let response = await addVisitor(req.body._id,req.body.visitorName,req.body.phoneNumber,req.body.companyName,req.body.date,req.body.time)
        res.send (response)
    }
    else
        res.send (" ")
        //console.log (" ")
})

app.post('/login/host/removeVisitor',verifyToken, async (req, res) => {   //remove visitor
    if ((role == "host")){
        let response = await removeVisitor(req.body.visitorName,req.body.date,req.body.time)
        res.send (response)
    }
    else
        res.send (" ")
       //console.log (" ")
})
    
//security http mehtods    
app.post("/login/security/activateAdmin" , verifyToken, async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await activateAdmin(req.body.username,req.body._id))
    else
        res.send (" ")
})

app.post("/login/security/deleteHost" , verifyToken, async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await deleteHostAcc(req.body.username))
    else
        res.send (" ")
})

app.post("/login/security/deleteVisitor" , verifyToken, async(req, res) => {  //delete visitor
    if ((role == "security"))
        res.send(await deleteVisitorAcc(req.body.username))
    else
        res.send (" ")
})

app.post("/login/security/register/visitor" , verifyToken, async (req, res) => {  //register visitor
    if ((role == "security"))
        res.send(await registerVisitor(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role,req.body.lastCheckinTime))
    else
        res.send (" ")
})
        
app.post("/login/security/register/host" , verifyToken, async(req, res) => {  //register host
    if ((role == "security"))
        res.send(await registerHost(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role))    
    else
        res.send (" ")     
})

app.get('/logout', (req, res) => {
    role = "null"
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
        res.send("")
    }
    res.end()
})


/**
 * @swagger
 *  /login:
 *    post:
 *      tags:
 *      - Login
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
 *                _id:
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
 *                visitorName:
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
 *  /login/security/register/host:
 *    post:
 *      tags:
 *      - Security
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
