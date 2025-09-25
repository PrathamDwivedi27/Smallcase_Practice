function findAngle(hour,minute){

    if (hour>=12) hour-=12;
    let angleByHour=30*hour+0.5*minute;
    let angleByMinute=6*minute;

    let angle=Math.abs(angleByHour-angleByMinute);

    let ans=Math.min(angle,360-angle);
    return ans;
}

console.log(findAngle(3,30));