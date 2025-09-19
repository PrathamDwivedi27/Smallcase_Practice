const express=require('express');
const bodyParser=require('body-parser')
const {validateNumber,validateStockName}=require('./helper')

const app=express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

const holdings=new Map();         // Here I will store holdings the specific customer have
// Map<symbol,{quantity:number, cost:number}>

const transactions=[];      // for calculating transaction history Array of objects 
    //{type:'Buy', company, quantity, cost, timestamp}

app.post('/stock/add',(req,res)=>{
    try {
        const {symbol,quantity,costToBuyStocks}=req.body;
        if (!validateStockName(symbol)){
            return res.status(400).json({
                message:"Something wrong with stock name",
            })
        }
        if (!validateNumber(quantity) || quantity<=0){
            return res.status(400).json({
                message:"Something wrong with quantity"
            })
        }
        if (!validateNumber(costToBuyStocks) || costToBuyStocks<=0){
            return res.status(400).json({
                message:"Something wrong with cost"
            })
        }
        const companyName=symbol.toUpperCase();
        if (!holdings.has(companyName)){    //if not present -> buying that company stocks for the first time
            holdings.set(companyName,{quantity,avgbuyPrice: costToBuyStocks})
        }
        else {  // buying second time 
            const holding=holdings.get(companyName);
            const totalCost=holding.avgbuyPrice*holding.quantity+quantity*costToBuyStocks;
            const newQty=holding.quantity+quantity
            const newAvg=totalCost/newQty

            holding.quantity=newQty
            holding.avgbuyPrice=newAvg

        }
        return res.status(200).json({
            holdings:Array.from(holdings.entries())
                .map(([sym,v])=>({
                    company:sym,
                    ...v
            }))
        })
    } catch (error) {
        console.log("Something went wrong in adding stock");
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
})

app.post('/stock/sell',(req,res)=>{
    try {
        const {symbol,quantity,costToSellStocks}=req.body;
        if (!validateStockName(symbol)){
            return res.status(400).json({
                message:"Something wrong with stock name",
            })
        }
        if (!validateNumber(quantity) || quantity<=0){
            return res.status(400).json({
                message:"Something wrong with quantity"
            })
        }
        if (!validateNumber(costToSellStocks) || costToSellStocks<=0){
            return res.status(400).json({
                message:"Something wrong with cost"
            })
        }

        const companyName=symbol.toUpperCase()
        if(!holdings.has(companyName)){
            return res.status(404).json({
                message:"This stock is not available"
            })
        }
        const s=holdings.get(companyName)
        if (s.quantity<quantity){
            return res.status(400).json({
                message:"Available stocks is less than selling stock"
            })
        }
        s.quantity-=quantity;
        if(s.quantity==0){
            holdings.delete(companyName)
        }

        return res.status(200).json({
            holdings:Array.from(holdings.entries())
                .map(([symbol,v])=>(
                    {
                        company:symbol,
                        ...v
                    }
                ))
        })
    } catch (error) {
        console.log("Something went wrong in adding stock");
        return res.status(500).json({
            message:"Something went wrong",
            err:error.message
        })
    }
})

app.get('/portfolio',(req,res)=>{
    try {
       const list=Array.from(holdings.entries())
        .map(([sym,v])=>
            ({
                company:sym,
                quantity:v.quantity,
                avgbuyPrice:v.avgbuyPrice})
        )
       return res.status(200).json({
            data:list
       }) 
    } catch (error) {
        console.log("Something went wrong in adding stock");
        return res.status(500).json({
            message:"Something went wrong",
            err:error.message
        })
    }
})








const PORT=3000

const setup_and_start_server=()=>{
    app.listen(PORT,()=>{
        console.log(`Server started running on PORT ${PORT}`)
    })
}

setup_and_start_server();
