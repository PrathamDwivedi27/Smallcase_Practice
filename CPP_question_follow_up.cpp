#include<bits/stdc++.h>
using namespace std;
#define ll long long

struct Lot{
    int quantity;
    int price;
};

int main(){
    int n;
    cin>>n;

    unordered_map<string, deque<Lot>>inventory;
    ll totalProfit=0;

    for(int i=0;i<n;i++){
        string type,symbol;
        int qty,price;
        cin>>type>>symbol>>qty>>price;

        if(type=="BUY"){
            inventory[symbol].push_back({qty,price});
        }
        else if(type=="SELL"){
            int remaining=qty;
            ll profit=0;

            auto &lots=inventory[symbol];

            while(remaining>0 && !lots.empty()){
                auto &front=lots.front();
                int sellQty=min(front.quantity,remaining);
                profit+=1ll*sellQty*(price-front.price);

                front.quantity-=sellQty;
                remaining-=sellQty;

                if(front.quantity==0){
                    lots.pop_front();
                }
            }

            if(remaining>0){
                cout<<"Not enough stock to sell"<<endl;
                return 0;
            }

            totalProfit+=profit;
            cout<<"Profit/Loss for this SELL:"<< profit<<endl;
        }
    }

    cout<< "Total Profit/Loss: "<< totalProfit<< endl;

    // Print remaining inventory for each stock
    cout<<"\nRemaining Inventory:\n";

    for (auto &entry : inventory) {
        cout << entry.first << ": ";
        auto &lots=entry.second;
        for (auto &lot : lots) {
            cout << "(" << lot.quantity << "@" << lot.price << ") ";
        }
        cout << "\n";
    }

    return 0;
}