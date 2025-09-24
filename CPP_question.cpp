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

    deque<Lot>inventory;
    ll totalProfit=0;

    for(int i=0;i<n;i++){
        string type;
        int qty,price;
        cin>>type>>qty>>price;

        if(type=="BUY"){
            inventory.push_back({qty,price});
        }
        else if(type=="SELL"){
            int remaining=qty;
            ll profit=0;

            while(remaining>0 && !inventory.empty()){
                auto &front=inventory.front();
                int sellQty=min(front.quantity,remaining);
                profit+=1ll*sellQty*(price-front.price);

                front.quantity-=sellQty;
                remaining-=sellQty;

                if(front.quantity==0){
                    inventory.pop_front();
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

    return 0;
}