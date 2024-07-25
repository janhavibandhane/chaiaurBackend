// routes/user.routes.js
import express from 'express';
import {loginUser,logoutUser,registerUser,refreshAccessToken} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
 
const router = express.Router();

router.post('/register',       //router i want route from registerUSer controoler
    upload.fields([ //middle ware  //multiple files gheto there is pload.single also
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),  

    registerUser
           );

router.post('/login',loginUser)

//secure route
router.post('/logout',verifyJWT, logoutUser) //verfiyJwt middleWare
router.post('/refreshAccessToken',refreshAccessToken)


export default router;
