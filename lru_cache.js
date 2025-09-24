class LRUCache{
    constructor(capacity){
        this.capacity=capacity;
        this.cache=new Map();       // it maintains insertion order, mostly recently used 
    }

    get(key){
        if(!this.cache.has(key)) return -1;

        const value=this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    put(key, value){
        if(this.cache.has(key)){    // agar pehle se hai to bas usko delete karke last mein lete aao
            this.cache.delete(key);
        }
        else if(this.cache.size>=this.capacity){   // agar nhi hai to check karo capacity paar nhi na kardiya
            // first element nikalo jo hoga least recently used
            const oldestKey=this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key,value);
    }

    print(){
        for (let [key,value] of this.cache){
            console.log(`${key} : ${value}`)
        }
    }
};

const lru=new LRUCache(2);
lru.put(1, "A");
lru.put(2, "B");
lru.print();
console.log(lru.get(1));
lru.print();
lru.put(3, "C");
console.log(lru.get(2)); 

lru.print();