const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

const swaggerUi = require ("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

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

const swaggerSpec = swaggerJsdoc (options);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve,swaggerUi.setup(swaggerSpec));	//localhost behind add this /api-docs
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
 })


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://s2s3a:abc1234@record.55pqast.mongodb.net/?retryWrites=true&w=majority";

//global variables
global.l = "true"   
global.host
global.role

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
        l = "false"
    }
})

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

async function login(Username,Password){  //user and host login

    const option={projection:{password:0}}  //pipeline to project usernamne and email

    const result = await client.db("user").collection("visitor").findOne({  
        $and:[
            {username:{$eq:Username}},
            {password:{$eq:Password}}
            ]
    },option)

    await client.db("user").collection("visitor").updateOne({  
        username:Username
    },
    {
        $currentDate: {
        "lastCheckinTime": true
     },
    })

    if(result){
        visitor = result.username
        console.log(result)
        console.log("Successfully Login")
        role = "visitor"
        return result
        //details(result.role)
    }
    else {
        const option={projection:{password:0}}  //pipeline to project usernamne and email

        const result = await client.db("user").collection("host").findOne({
            $and:[
                {username:{$eq:Username}},
                {password:{$eq:Password}}
                ]
        },option)

        if(result){
            host = result.username
            console.log(result)
            console.log("Successfully Login")
            l = "true"
            role = "host"
            return result
            //details(result.role)
            
        }
        else {
            const option={projection:{password:0}}  //pipeline to project usernamne and email

            const result = await client.db("user").collection("security").findOne({
                $and:[
                    {username:{$eq:Username}},
                    {password:{$eq:Password}}
                    ]
            },option)

            if(result){
                security = result.username
                console.log(result)
                console.log("Successfully Login")
                l = "true"
                role = "security"
                return result
                //details(result.role)
                
            }
            else{
                console.log("User not found or password error")
                return "User not found or password error"
            }
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
        console.log(result)
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
        console.log(result)
        return "The account was successfully deleted"
    }
    else{   
        return "The account you was tried to delete doesn't exist"
    }
}

async function updateVisitorPass(regPassword){  //change only when password is different
    result = await client.db("user").collection("visitor").findOne ({username:{$eq:visitor}})

    if (result.password != regPassword){
        await client.db("user").collection("visitor").updateOne({
            username:{$eq:visitor}
        },{$set:{password:regPassword}})

        let data = "Password "+visitor+" is successfully updated"
        return data
    }
    else
        return "Same password cannot be applied"
}        

async function updateHostPass(regPassword){

    result = await client.db("user").collection("host").findOne ({username:{$eq:host}})

    if (result.password != regPassword){
        await client.db("user").collection("host").updateOne({
            username:{$eq:host}
        },{$set:{password:regPassword}})

        let data= "Password "+host+" is successfully updated"
        return data
    }
    else
        return "Same password cannot be applied"
}

async function updateSecurityPass(regPassword){

    result = await client.db("user").collection("security").findOne ({username:{$eq:security}})

    if (result.password != regPassword){
        await client.db("user").collection("security").updateOne({
            username:{$eq:security}
        },{$set:{password:regPassword}})

        let data= "Password "+security+" is successfully updated"
        return data
    }
    else
        return "Same password cannot be applied"
}

async function addVisitor(visitorIC,visitorName,phoneNumber,companyName,date,time){
    //to check whether there is same visitor in array
    let result = await client.db("user").collection("visitor").findOne({_id: visitorIC, username: visitorName})
    
    if (result){
        let addVis = await client.db("user").collection("visitor").findOne({_id: visitorIC, username: visitorName, "host.name": host, "host.time": time, "host.date": date})
        if (!addVis){
            await client.db("user").collection("host").updateOne({
                username: host
            },{$push:{visitor:{name:visitorName,phone:phoneNumber,company:companyName,date:date,time:time}}},{upsert:true})

            await client.db("user").collection("visitor").updateOne({
                username:{$eq:visitorName}
            },{$push:{host:{name:host,date:date,time:time}}})
            console.log("The visitor is added successfully")
            return "The visitor is added successfully"
        }
        else
            console.log ("The visitor you entered already in list")
            return "The visitor you entered already in list"

    }
    else 
        console.log ("The visitor you entered hasn't registered, please register with security in charge")
        return "The visitor you entered hasn't registered, please register with security in charge"
            
            
}

async function removeVisitor(removeVisitor,removeDate,removeTime){
    
    let result = await client.db("user").collection("visitor").findOne({username: removeVisitor, "host.name": host, "host.date":removeDate,"host.time":removeTime})
    if (result){
        await client.db("user").collection("host").updateOne({
            username: host
        },{$pull:{visitor:{name:removeVisitor},visitor:{date:removeDate},visitor:{time:removeTime}}},{upsert:true})

        
        await client.db("user").collection("visitor").updateOne({
            username: removeVisitor
        },{$pull:{host:{name:host,date:removeDate,time:removeTime}}},{upsert:true})

        
        //let data = "Visitor "+removeVisitor+" is successfully remove"
        console.log("Visitor "+removeVisitor+" is successfully remove")
        let data = "Visitor "+removeVisitor+" is successfully remove"
        return "data"
    }
    else
        console.log("No appointment found")
        return "No appointment found"
}

async function searchVisitor(IC){
    const option={projection:{password:0,role:0}}  //pipeline to project usernamne and email

    const result = await client.db("user").collection("visitor").findOne({
        _id:{$eq:IC}
    },option)
    console.log(result)
    return result
}

//HTTP login method

app.post('/login', async(req, res) => {   //login
    res.send(await login(req.body.username,req.body.password))
})


//visitor HTTP methods    
        
/*app.post('/login/visitor', async(req, res) => {   //login
    res.send(await login(req.body.username,req.body.password))
})*/

app.post('/login/visitor/updatePassword', async(req, res) => {   //login
    console.log(role)
    if ((role == "visitor")){
        res.send (await updateVisitorPass(req.body.password))
    }
    else
        res.send ("You are not a visitor")
        console.log ("You are not a visitor")
})

app.get('/login/visitor/logout', (req, res) => {
    if ((role == "visitor")){
        role = "NULL"
        res.send("You have successfully log out")
        console.log("You have successfully log out")
    }
    else
        res.send ("You had log out")
        console.log ("You had log out")
})
    
//host http method 

/*app.post('/login/host', async(req, res) => {   //login  
    res.send(await login(req.body.username,req.body.password))
})*/

app.post('/login/host/updatePassword', async(req, res) => {   //login
    if ((role == "host")){
        res.send(await updateHostPass(req.body.password))
    }
    else
        res.send ("You are not a host") 
})

app.post('/login/host/search', async(req, res) => {   //look up visitor details
    if ((role == "host"))
        res.send (await searchVisitor(req.body._id))
    else
        res.send ("You are not a host")
})

app.post('/login/host/addVisitor', async (req, res) => {   //add visitor
    if ((role == "host")){
        let response = await addVisitor(req.body._id,req.body.visitorName,req.body.phoneNumber,req.body.companyName,req.body.date,req.body.time)
        res.send (response)
    }
    else
        console.log ("You are not a host")
})

app.post('/login/host/removeVisitor', (req, res) => {   //remove visitor
    if ((role == "host")){
        let response = removeVisitor(req.body.visitorName,req.body.date,req.body.time)
        res.send (response)
    }
    else
        console.log ("You are not a host")
})

app.get('/login/host/logout', (req, res) => { 
    if ((role == "host")){
        role = "NULL"
        res.send("You have successfully log out")
        console.log("You have successfully log out")
    }
    else
        res.send ("You had log out")
        console.log ("You had log out")
})
    
//security http mehtods    

app.post('/login/security/updatePassword', async(req, res) => {   //login
    if ((role == "security")){
        res.send(await updateSecurityPass(req.body.password))
    }
    else
        res.send ("You are not a security") 
})

app.post("/login/security/deleteHost" , async(req, res) => {  //delete host
    if ((role == "security"))
        res.send(await deleteHostAcc(req.body.username))
    else
        res.send ("You are not a security")
})

app.post("/login/security/deleteVisitor" , async(req, res) => {  //delete visitor
    if ((role == "security"))
        res.send(await deleteVisitorAcc(req.body.username))
    else
        res.send ("You are not a security")
})

app.post("/login/security/register/visitor" , async (req, res) => {  //register visitor
    if ((role == "security"))
        res.send(await registerVisitor(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role,req.body.lastCheckinTime))
    else
        res.send ("You are not a security")
})
        
app.post("/login/security/register/host" , async(req, res) => {  //register host
    if ((role == "security"))
        res.send(await registerHost(req.body._id,req.body.username,req.body.password,req.body.email,req.body.role))    
    else
        res.send ("You are not a security")     
})

app.get('/login/security/logout', (req, res) => {
    if ((role == "security")){
        role = "NULL"
        res.send("You have successfully log out")
        console.log("You have successfully log out")
    }
    else
        res.send ("You had log out")
        console.log ("You had log out")
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
 *  /login/visitor/updatePassword:
 *    post:
 *      tags:
 *      - Visitor
 *      description: Visitor update password
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                password:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/updatePassword:
 *    post:
 *      tags:
 *      - Security 
 *      description: Security update password
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                password:
 *                  type: string
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/host/updatePassword:
 *    post:
 *      tags:
 *      - Host 
 *      description: Host update password
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                password:
 *                  type: string
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
 *  /login/security/register/visitor:
 *    post:
 *      tags:
 *      - Security
 *      description: Register visitor
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
 *  /login/security/deleteVisitor:
 *    post:
 *      tags:
 *      - Security
 *      description: Delete visitor
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
 *  /login/visitor/logout:
 *    get:
 *      tags:
 *      - Visitor
 *      description: User logout
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/security/logout:
 *    get:
 *      tags:
 *      - Security
 *      description: User logout
 *      responses:
 *        200:
 *          description: OK
 */

/**
 * @swagger
 *  /login/host/logout:
 *    get:
 *      tags:
 *      - Host
 *      description: User logout
 *      responses:
 *        200:
 *          description: OK
 */