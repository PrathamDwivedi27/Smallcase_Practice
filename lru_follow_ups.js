class LRUCache{
    constructor(capacity, defaultTTL=null){
        this.capacity=capacity;
        this.cache=new Map();   // key : (value,expiry)
        this.defaultTTL=defaultTTL;
    }

    isExpired(entry){
        if(!entry.expiry) return false; //if not present means no ttl applied
        return Date.now()>entry.expiry;
    }

    get(key){
        if(!this.cache.has(key)) return -1;

        const entry=this.cache.get(key);    // entry means value and expiry combined

        if(this.isExpired(entry)){
            this.cache.delete(key);     // lazy enviction
            return -1;      // nhi mila
        }

        this.cache.delete(key);
        this.cache.set(key,entry);

        return entry.value;

    }

    set(key,value,ttl=this.defaultTTL){
        if(this.cache.has(key)){
            this.cache.delete(key);
        }

        if(this.cache.size >=this.capacity){
            const oldestKey=this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        const expiry=ttl?Date.now()+ttl:null;
        this.cache.set(key,{value,expiry});
    }
};


const cache=new LRUCache(3,2000);
cache.set("a", 1);
cache.set("b", 2, 5000); // custom TTL = 5s
cache.set("c", 3);

console.log(cache.get("a")); // 1
setTimeout(() => console.log(cache.get("a")), 2500);