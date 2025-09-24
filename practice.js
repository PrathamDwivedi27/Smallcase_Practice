const express=require('express');
const bodyParser=require('body-parser');
const fs=require('fs');
const {getCurrentPrice}=require('./helper');

const holdingsData=JSON.parse(fs.readFileSync('holdings.json','utf-8'));
const transactions=[];
const watchlists=new Map();

const app=express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const holdings=new Map(Object.entries(holdingsData));       // userId as key and value as arrays of objects 

app.post('/stocks/buy',(req,res)=>{
    try {
        const {userId, stocksSymbol}=req.body;
        const quantity=Number(req.body.quantity);
        const price=Number(req.body.price);

        if(!userId || !stocksSymbol || !quantity || !price || quantity<=0 || price<=0){
            return res.status(404).json({
                message:"All fields should be present and positive numbers"
            })
        }

        if (!holdings.has(userId)){
            holdings.set(userId,[{
                stocksSymbol:stocksSymbol.toUpperCase(),
                quantity:quantity,
                avgBuyPrice:price
            }])
        }
        else {
            const userStocks = holdings.get(userId);
            const stock = userStocks.find(s => s.stocksSymbol === stocksSymbol.toUpperCase());

            if (stock) {
                // Update existing stock
                const totalCost = stock.avgBuyPrice * stock.quantity + price * quantity;
                const totalQty = stock.quantity + quantity;
                const newAverage = totalCost / totalQty;
                stock.avgBuyPrice=parseFloat(newAverage.toFixed(3));
                stock.quantity = totalQty;
            } else {
                // New stock for user
                userStocks.push({ stocksSymbol, quantity, avgBuyPrice: parseFloat(price.toFixed(3)) });
            }
        }

        transactions.push({
            transactionId:transactions.length+1,
            userId,
            stocksSymbol,
            quantity,
            price,
            type:'BUY',
            timestamp:new Date()
        })

        return res.status(200).json({
            message:'Stock bought successfully',
            holdings:holdings.get(userId)
        })
    } catch (error) {
        return res.status(500).json({
            message:'Something went wrong while buying stocks',
            error:error.message
        })
    }
})

app.post('/stocks/sell',(req,res)=>{
    try {
        let {userId, stocksSymbol}=req.body;
        const quantity=Number(req.body.quantity);
        const price=Number(req.body.price);

        stocksSymbol=stocksSymbol.toUpperCase();

        if(!userId || !stocksSymbol || !quantity || !price || quantity<=0 || price<=0){
            return res.status(404).json({
                message:"All fields should be present and positive numbers"
            })
        }

        if(!holdings.get(userId)){
            return res.status(404).json({
                message:"No user found"
            })
        }

        const stockHoldings=holdings.get(userId);
        

        const stock=stockHoldings.find(s=>s.stocksSymbol==stocksSymbol);
        if(!stock){
            return res.status(404).json({
                message:"Stock not found"
            })
        }
        if(quantity>stock.quantity){
            return res.status(400).json({
                message:"Selling quantity is more than holding shares"
            })
        }

        stock.quantity-=quantity;
        if(stock.quantity==0){
            const updateHoldings=stockHoldings.filter(s=>s.stocksSymbol!==stocksSymbol);

            holdings.set(userId,updateHoldings)
        }

        transactions.push({
            transactionId:transactions.length+1,
            userId,
            stocksSymbol,
            quantity,
            price,
            type:'SELL',
            timestamp:new Date()
        })

        return res.status(200).json({
            message:'Stock bought successfully',
            holdings:holdings.get(userId)
        })
        

    } catch (error) {
        return res.status(500).json({
            message:'Something went wrong while selling stocks',
            error:error.message
        }) 
    }
})

app.get('/stocks/portfolio/:userId',(req,res)=>{
    try {
        const {userId}=req.params;
        const user=holdings.get(userId);

        if(!user){
            return res.status(404).json({
                message:"No user found"
            })
        }

        // let totalInvestedValue=0;
        // user.forEach((s)=>{
        //     totalInvestedValue+=(s.quantity*s.avgBuyPrice);
        // })

        const totalInvestedValue = user.reduce(
            (sum, stock) => sum + stock.quantity * stock.avgBuyPrice,
            0
            );

        return res.status(200).json({
            message:"Sucessfully fetched user portfolio",
            holdings:user,
            totalInvestedValue:totalInvestedValue
        })
    } catch (error) {
        return res.status(500).json({
            message:'Something went wrong while fetching portfolio',
            error:error.message
        }) 
    }

})

app.get('/stocks/holdings',(req,res)=>{
    try {
        const allHoldings= Array.from(holdings.entries()).map(([user,stockHoldings])=>({
            user,
            stockHoldings

        }))

        return res.status(200).json({
            message: "All user holdings fetched successfully",
            users: allHoldings
        });
    } catch (error) {
        return res.status(500).json({
            message:'Something went wrong while fetching holdings',
            error:error.message
        }) 
    }
})

app.get('/stocks/portfolio/value/:userId',(req,res)=>{
    try {
        const {userId}=req.params;
        const user=holdings.get(userId);    // this is a object

        if(!user){
            return res.status(404).json({
                message:"No user found"
            })
        }

        // This was logically correct but we can represent it in a more efficient way
        // const totalPortfolioValue=user.reduce((sum, stock)=>{
        //     return sum+(getCurrentPrice(stock.stocksSymbol)*stock.quantity)
        // },0)

        // //Calculates profit/loss for each stock: (currentPrice - avgBuyPrice) * quantity.
        // const profitLoss=[];
        // for (let stock of user){
        //     let profitOrLoss=(getCurrentPrice(stock.stocksSymbol)-stock.avgBuyPrice)*stock.quantity;
        //     profitLoss.push({stocks:stock.stocksSymbol,profitOrLoss:profitOrLoss});
        // }

        // return res.status(200).json({
        //     message:"Sucessfully fetched portfolio ",
        //     totalPortfolioValue:totalPortfolioValue,
        //     profitLoss:profitLoss

        // })

        const stockAnalytics = user.map(stock => {
            const currentPrice = getCurrentPrice(stock.stockSymbol);
            const profitOrLoss =
                (currentPrice - stock.avgBuyPrice) * stock.quantity;

            return {
                stockSymbol: stock.stockSymbol,
                quantity: stock.quantity,
                avgBuyPrice: stock.avgBuyPrice,
                currentPrice,
                profitOrLoss
            };
        });

        // Calculate totals
        const totalPortfolioValue = stockAnalytics.reduce(
        (sum, s) => sum + s.currentPrice * s.quantity,
        0
        );

        const totalProfitOrLoss = stockAnalytics.reduce(
        (sum, s) => sum + s.profitOrLoss,
        0
        );

        return res.status(200).json({
        message: "Successfully fetched portfolio analytics",
        userId,
        stocks: stockAnalytics,
        totalPortfolioValue,
        totalProfitOrLoss
        });
    } catch (error) {
        return res.status(500).json({
            message:`Something went wrong while fetching user's portfolio`,
            error:error.message
        }) 
    }
})

app.get('/stocks/transactions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10; // default 10

    // Filter transactions for this user
    const userTxns = transactions.filter(txn => txn.userId === userId);

    if (userTxns.length === 0) {
      return res.status(404).json({
        message: "No transactions found for this user"
      });
    }

    // Sort by latest timestamp and take only last N
    const lastTxns = userTxns
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return res.status(200).json({
      message: "Successfully fetched transaction history",
      userId,
      transactions: lastTxns
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching transaction history",
      error: error.message
    });
  }
});

app.get('/stocks/topholdings/:userId',(req,res)=>{
    try {
        const {userId}=req.params;
        const N=parseInt(req.query.limit) || 5;

        const user=holdings.get(userId);
        if (!user){
            return res.status(404).json({
                message:"No user found"
            })
        }

        const stocks=[];
        user.forEach((s)=>{
            stocks.push({company:s.stocksSymbol,totalValue:s.quantity*s.avgBuyPrice})
        })

        const topNHoldings=stocks.sort((a,b)=>{
            return b.totalValue-a.totalValue
        }).slice(0,N);

        return res.status(200).json({
            message:"Successfully fetched the top N holdings",
            data:topNHoldings
        })

    } catch (error) {
        return res.status(500).json({
        message: "Something went wrong while fetching transaction history",
        error: error.message
        });
    }
})

app.get('/stocks/profitloss/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const N = parseInt(req.query.limit) || 5; // default top 5
    const type = req.query.type || 'all'; // "profit", "loss", or "all"

    const userStocks = holdings.get(userId);
    if (!userStocks || userStocks.length === 0) {
      return res.status(404).json({
        message: "No holdings found for this user"
      });
    }

    // Calculate profit/loss for each stock
    const stocksWithProfit = userStocks.map(stock => {
      const currentPrice = getCurrentPrice(stock.stocksSymbol); // mock function
      const profitOrLoss = (currentPrice - stock.avgBuyPrice) * stock.quantity;
      return {
        stockSymbol: stock.stocksSymbol,
        quantity: stock.quantity,
        avgBuyPrice: stock.avgBuyPrice,
        currentPrice,
        profitOrLoss
      };
    });

    // Filter by type if requested
    let filteredStocks = stocksWithProfit;
    if (type === 'profit') {
      filteredStocks = stocksWithProfit.filter(s => s.profitOrLoss > 0);
    } else if (type === 'loss') {
      filteredStocks = stocksWithProfit.filter(s => s.profitOrLoss < 0);
    }

    // Sort descending by profitOrLoss
    filteredStocks.sort((a, b) => b.profitOrLoss - a.profitOrLoss);

    // Take top N
    const topStocks = filteredStocks.slice(0, N);

    return res.status(200).json({
      message: "Successfully fetched top profit/loss stocks",
      userId,
      stocks: topStocks
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching profit/loss",
      error: error.message
    });
  }
});

app.post('/stocks/watchlist/:userId/add', (req, res) => {
  const { userId } = req.params;
  const { stockSymbol } = req.body;

  if (!stockSymbol) {
    return res.status(400).json({ message: "Stock symbol is required" });
  }

  if (!watchlists.has(userId)) {
    watchlists.set(userId, new Set());
  }

  const userWatchlist = watchlists.get(userId);
  userWatchlist.add(stockSymbol.toUpperCase());

  return res.status(200).json({
    message: "Stock added to watchlist",
    watchlist: Array.from(userWatchlist)
  });
});

app.post('/stocks/watchlist/:userId/remove', (req, res) => {
  const { userId } = req.params;
  const { stockSymbol } = req.body;

  if (!stockSymbol || !watchlists.has(userId)) {
    return res.status(404).json({ message: "Stock or user not found" });
  }

  const userWatchlist = watchlists.get(userId);
  userWatchlist.delete(stockSymbol.toUpperCase());

  return res.status(200).json({
    message: "Stock removed from watchlist",
    watchlist: Array.from(userWatchlist)
  });
});

app.get('/stocks/watchlist/:userId', (req, res) => {
  const { userId } = req.params;

  if (!watchlists.has(userId)) {
    return res.status(404).json({ message: "User not found" });
  }

  const userWatchlist = watchlists.get(userId);

  return res.status(200).json({
    message: "Fetched watchlist successfully",
    watchlist: Array.from(userWatchlist)
  });
});

app.get('/stocks/leaderboard',(req,res)=>{
    try {
        const N = parseInt(req.query.limit) || 5;
        const results=[];
        for (let [userId, stocks] of holdings){
            let totalValue=0;
            stocks.forEach(s=>{
                totalValue+=s.quantity*s.avgBuyPrice;
            })
            results.push({userId, totalValue})
        }
        results.sort((a, b) => b.totalValue - a.totalValue);
        const topN=results.slice(0,N);

        return res.status(200).json({
            message:"Successfully fetched leaderboard",
            leaderboard:topN
        })
    } catch (error) {
        return res.status(500).json({
            message:"Something went wrong in fetching leaderboard",
            error:error.message
        })
    }
})

app.get('/stocks/search',(req,res)=>{
    try {
        const symbol=req.query.symbol.toUpperCase();
        const result=[];
        for (let [userId, stock] of holdings){
            const matches=stock.filter(s=>s.stocksSymbol==symbol)
            matches.forEach((m)=>{
                result.push({
                    userId:userId,
                    quantity:m.quantity,
                    avgBuyPrice:m.avgBuyPrice
                })
            })
        }
        return res.status(200).json({
            message:"Search api is implemented",
            searchResult:result
        })
    } catch (error) {
        return res.status(500).json({
            message:"Something went wrong in search api",
            error:error.message
        })
    }
})

app.post('/stocks/batch',(req,res)=>{
    try {
        const {userId, operations}=req.body;
        if (!userId || !Array.isArray(operations) || operations.length === 0) {
            return res.status(400).json({ message: "Invalid input" });
        }

        const currentHoldings=holdings.get(userId) || [];

        const tempHoldings=JSON.parse(JSON.stringify(currentHoldings));     // This is how you do deep copy
        for (let op of operations){
            const symbol=op.stocksSymbol.toUpperCase();
            const qty = Number(op.quantity);
            const price = Number(op.price);

            if (!symbol || qty <= 0 || price <= 0) {
                return res.status(400).json({ message: "Invalid operation data" });
            }

            const stock=tempHoldings.find(s=>s.stocksSymbol==symbol);

            if (op.type === "BUY") {
                if (stock) {
                    const totalCost = stock.avgBuyPrice * stock.quantity + price * qty;
                    const totalQty = stock.quantity + qty;
                    stock.avgBuyPrice = parseFloat((totalCost / totalQty).toFixed(3));
                    stock.quantity = totalQty;
                } 
                else {
                    tempHoldings.push({ stocksSymbol: symbol, quantity: qty, avgBuyPrice: price });
                }
            } 
            else if (op.type === "SELL") {
                if (!stock || qty > stock.quantity) {
                    return res.status(400).json({ message: `Cannot sell ${qty} shares of ${symbol}` });
                }
                stock.quantity -= qty;
                if (stock.quantity === 0) {
                // remove stock from holdings
                    const index = tempHoldings.indexOf(stock);
                    tempHoldings.splice(index, 1);      // index, delete, insert
                }
            }
        }
        holdings.set(userId,tempHoldings);
        return res.status(200).json({
            message:"Successfully done batch opertion",
            holdings:tempHoldings
        })

    } catch (error) {
        return res.status(500).json({
            message:"Something went wrong while inserting in batching",
            error:error.message
        })
    }
})

app.delete('/stocks/delete/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!holdings.has(userId)) {
      return res.status(404).json({
        message: "No user found with this ID"
      });
    }

    holdings.delete(userId);

    return res.status(200).json({
      message: `User ${userId} successfully deleted`
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while deleting the user",
      error: error.message
    });
  }
});


const PORT=3000;
const setup_and_start_server=()=>{
    app.listen(PORT,()=>{
        console.log(`Server started running on PORT ${PORT}`)
    })
}

setup_and_start_server();