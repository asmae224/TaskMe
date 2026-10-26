import bcrypt from 'bcrypt'
import { User} from '../models/userModel.js'
import jsonwebtoken from 'jsonwebtoken'
const jwt = jsonwebtoken

import dotenv from 'dotenv'
dotenv.config()

export const createUser = async (req, res) => {
        
    try {
        const passwordHashed = await bcrypt.hash(req.body.password, 12)
        // console.log(passwordHashed);
        
        const user = await User.create({
            firstName:req.body.firstName, 
            lastName:req.body.lastName, 
            email:req.body.email,
            specialite:req.body.specialite,
            grade:req.body.grade,
            role:req.body.role,
            diplomes:req.body.diplomes,
            formations:req.body.formations,
            password:passwordHashed// 12 represente the salt
        })
        res.status(200).json({
            message:'user created successfly', 
            data: user
        })
    } catch (error) {
        res.status(500).json({
            message: "error creating user",
            error: error.message
            });
        
    }
};

export const loginUser = async (req, res) => {
        
    try {
        const user = await User.findOne({
            email:req.body.email
        })
        //console.log(user);
        
        if(!user){
            res.status(404).json({massage:"user not found"})
        }
        if(!await bcrypt.compare(req.body.password, user.password)){
            res.status(400).json(
                {massage:"wrong password"}
            )
        }
        user.actif=true;
        user.save()
        const token = jwt.sign({_id:user.id} , process.env.JWT_SECRET, { expiresIn: "1d" });
        //console.log(token);
        res.cookie('jwt' , token , {
            httpOnly:true, 
            maxAge:24*60*60*1000
        })
        res.json({
            massage:"success",
            user:user
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "login error",
            error: error.message
            });
        
    } }

export const getToken = async (req, res) =>
{
    try {
        const cookie = req.cookies['jwt']
        if(!cookie){
            return res.status(401).json({
                message:'No taken provided'
            })
        }
        const c = jwt.verify(cookie, process.env.JWT_SECRET)
        if(!c){
            return res.status(401).send({
                error:"you not authenticated"
            })
        }
        const user = await User.findById(
            {_id: c._id}
        )
        if(!user){
            return res.status(404).json({message:"user not found"})
        }
        const {password, ...data} = user.toObject();
        console.log(data);
        
        return res.status(200).json({data : data});
    } catch (error) {
        return res.status(401).send(
            {
                message:error.message
            }
        )
    }
}

export const allUsers = async (req, res) =>{
    try {
        
        const users = await User.find()
        if(!users){
            return res.status(401).json({
                message: 'users not found'
            })
        }
        return res.status(200).json({
            data: users,
            message: 'users affiches avec succes'
        })

    } catch (error) {
        return res.status(402).json({
            message: error.message,
        })
    }
}

export const logout = async (req, res) =>
{
    const {id} = req.params
    const user =await User.findById(id)
    if(user){
        user.actif= false
        user.save()
    }
    res.cookie('jwt', '',{
        maxAge:0
    })

    res.send({
        massage:"you are logged out now"
    })
}

export const  deleteUser = async (req, res) =>{
    
    const {id} = req.params
    const deletedUser = await User.findByIdAndDelete(id)
    if(!deletedUser) {
        return res.status(404).json({message:'error while deleting user'})
    }
    return res.status(200).json({
        message:'user deleted successfuly',
        userDeleted : deletedUser        
    })
}

export const updateUser = async (req, res) =>
{
    const {id} = req.params
    const userUpdated = await User.findByIdAndUpdate(id,req.body,{new:true})
    if(!userUpdated) {
        return res.status(402).json({
            message:'Erreur lors de trouver cet utilisateur'
        })
    }

    return res.status(200).json({
        message:'user updated successfully',
        data: userUpdated
    })

}



export const distribution = async (req, res) => {
  try {
    
    const users = await User.find();
    const counts = {
      PEDAGOGIQUE: 0,
      ORIENTATION: 0,
      PLANIFICATION: 0,
      FINANCIER: 0,
    };

    users.forEach(user => {
      if (counts[user.specialite] !== undefined) counts[user.specialite]++;
    });

    const totalUsers = users.length || 1; 

 
    const distribution = Object.entries(counts).map(([label, value]) => ({
      label,
      value: Math.round((value / totalUsers) * 100), 
      color:
        label === "PEDAGOGIQUE"
          ? "primary"
          : label === "ORIENTATION"
          ? "success"
          : label === "PLANIFICATION"
          ? "warning"
          : "danger",
    }));

    res.json(distribution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


