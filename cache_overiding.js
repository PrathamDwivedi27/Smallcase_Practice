const express=require('express');
const app=express();


function cacheMiddleware(defaultTTL=5000){
    const cacheStore=new Map();     // key :{value, expiry}

    // background cleanup to remove expired key
    setTimeout(()=>{
        const now=Date.now();
        for(let [key, {expiry}] of cacheStore){
            if (expiry && expiry<now){
                cacheStore.delete(key);
            }
        }
    },1000)

    return (res,req,next)=>{
        // isi ko overide kar rhe based on arguments
        res.cache=function(key,value,ttl){
            //get 
            if(arguments.length==1){
                const entry=cacheStore.get(key);
                if(!entry){
                    return null;
                }
                if(entry.expiry && entry.expiry<Date.now()){
                    cacheStore.delete(key);
                    return null;
                }
                return entry.value;
            }

            if(arguments.length==2 || arguments.length==3){
                
            }
        }

        
    }
}




















app.listen(3000, () => console.log("✅ Server running on port 3000"));