import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { ApiResPonse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}  
        //accesToken =ekda login kel me 1day acces dil tr kitit pn vela ye login n karayla lagt accestoken sangto konta user ahe
        //refreshToken=accestoken invalid zhal continus with mail karto mg user cha token ani refresh token match hot vaps work suru

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


// register user
const registerUser = asyncHandler(async (req, res) => {
    // Your registration logic here
    //     get user details from frontend
    //     2.validation(email dily ki ny empty ny dil na)
    //     3.check if user already exists
    //     4.check for images,check for avatar
    //     5.upload them to cloudinary,avatar
    //     6.create user object-create entry in db
    //     7.remove pass and refresh token field from response
    //     8.check for user creation 
    //     return res
 
//     1.get user details from frontend
//     data come from frontend in req.body

    const { fullName, email, username, password } = req.body;

    // 2.Validation
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(404, "All fields are required");
    }

    // 3.Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    //4.check for images,check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    //5.Upload them to Cloudinary, avatar and coverImage
    const avatar = await uploadOnClodinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnClodinary(coverImageLocalPath) : null;  //file he to bhejo nahi to nahi

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    //6.create user object-create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    //7.Remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    //8.Check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Registering user: something went wrong");
    }

    //9.Return response
    return res.status(201).json(
        new ApiResPonse(200, createdUser, "User Registered Successfully")
    );
});

//login user
const loginUser=asyncHandler(async(req,res)=>{
       //1.req-body ->data
       //2.username or email
       //3.find user
       //4.check password
       //5.access and refresh token generate
       //6.send cookies

       //1.req-body ->data
       const {email,username,password}=req.body

       //2.username or email
       if(!username && !email){
        throw new ApiError(400,"Username or Email is requried")
       }

       //3.find user [by email or username]
       const user=await User.findOne({
        $or:[{username},{email}]
       })

       if(!user){
        throw new ApiError(400,"user dose not exist");
       }
       

       //4.check password
       const isPasswordValid=await user.isPasswordCorrect(password)
       if(!isPasswordValid){
        throw new ApiError(401,"Passowrd invalid");
       }

       //5.access and refresh token generate
       const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    
       const loggedInUser=await User.findById(user._id).
       select("-password -refreshToken")

       //6.send cookies (cokkie will modify only by server menas backend)
       const options={
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',  // For added security
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
       }
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .json(
        new ApiResPonse(
            200,{
                //sending data 
                user:loggedInUser,accessToken,refreshToken
            },
            "USer logged in succesfully"
        )
       )
}) 

//logout user
const logoutUser=asyncHandler(async(req,res)=>{
      await User.findByIdAndUpdate(
        req.user._id,{
            $unset:{
                refreshToken:1
            }
        },{
            new:true
        }
      )
      const options={
        httpOnly:true,
        secure:true
       }
       return res
       .status(200)
       .clearCookie("accessToken",options)
       .clearCookie("refreshToken",options)
       .json(
        new ApiResPonse (200,{},"User logout")
       )
})

//rereshAccessToken
// const refreshAccessToken=asyncHandler(async(req,res)=>{

//     //1. taking refresh token
//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

//     if(!incomingRefreshToken){
//         throw new ApiError(401,"unauthorized request")
//     }

//     //2. coded token la decoded kel using jwt.verify
//    try {
//       const decodedToken=jwt.verify(
//          incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
//      )
 
//      //3. koni mudam ala wihtout login tr check it user ahe pn khar madhe ki ny
//      const user=await User.findById(decodedToken?._id)
//      if(!user){
//          throw new ApiError(401,"Invalid refresh token")
//      }
 
//      // 4.now match incmoingRefreshToken and user Token
//      if(incomingRefreshToken !==user?.refreshToken){
//          throw new ApiError(401,"refresh token is expired or used")
//      }
 
//      //5.Mtach tokens then generate new
//      const options={
//          httpOnly:true,
//          secure:true
//      }
//      const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
 
//      return res
//      .status(200)
//      .cookie("accessToken",accessToken)
//      .cookie("refreshToken",newRefreshToken)
//      .json(
//          new ApiResPonse(
//             200,
//             {
//                 accessToken,refreshToken:newRefreshToken

//             },
//             "Access token refreshed"
 
//          )
//      )
//    } catch (error) {
//         throw new ApiError(401,error.message||"invalid token")
//    }
// })
const refreshAccessToken=asyncHandler(async(req,res,next)=>{
try {
    // 1. Take refresh token from cookies or body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 2. Decode the token using jwt.verify
    let decodedToken;
    try {
      decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, "Invalid token");
    }

    // 3. Check if the user exists
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // 4. Match incomingRefreshToken and user's stored refreshToken
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // 5. Generate new tokens
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResPonse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );

  } catch (error) {
    next(error);
  }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    
    //1.user is avilabel
    const user=await User.findById(req.user?._id)

    //2.isisPasswordCorrect comming from user.model.js
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old pass")
    }

    //3.password is saving id isPasswordCorrect is matches with oldPass
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResPonse(200,{},"Password chnage Succesfully"))
    
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetch successFully")
})

const updateAccountDetalis=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fileds are Requried")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        { new:true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResPonse(200,user,"USer details update succesfully"))
})

const updateUserAvtar= asyncHandler(async(req,res)=>{
    // 1.file taking from req.file
    const avatarLocalPath=req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avtar file is missing")
    }

    // upload on cloudinary
    const avatar=await uploadOnClodinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while Uploading on Avtar")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResPonse(200,user,"Avatar update succesfully")
    )
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
    // 1.file taking from req.file
    const coverImageLocalPath=req.file?.path
    
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }

    // upload on cloudinary
    const coverImage=await uploadOnClodinary(coverImageLocalPath)

    if(!coverImageLocalPath.url){
        throw new ApiError(400,"Error while Uploading on coverImage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResPonse(200,user,"CoverImage update succesfully")
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    // from link
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }
    const channel=await User.aggregatePaginate([

    // 1.pipline{is user mtached}
    {
            $match:{
            username:username?.toLowerCase()
        }
    },
    //2
    {
        $lookup:{
            from:"subsciptiona",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    //3.
    {
        $lookup:{
            from:"subsciptiona",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscriberdTo"
        }
    },
    //4.
    {
        addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscriberdTo"
            },
            isSubscribed:{ //subsribe kiya he kya?
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    //5.
    {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1

        }
    }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel dose not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResPonse(200,channel[0],"user channel fetched succesfully")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetalis,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile

 };