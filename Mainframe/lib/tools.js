var tools = module.exports = {};

tools.getTimestamp = (test) => {
    return ((test.getHours() < 10) ? "0"+ test.getHours(): test.getHours()) + ":" + ((test.getMinutes() < 10) ? "0"+ test.getMinutes(): test.getMinutes()) + ":"+ ((test.getSeconds() < 10) ? "0"+ test.getSeconds(): test.getSeconds()) + ":" + ((test.getMilliseconds() < 100) ? (test.getMilliseconds() < 10) ? "00"+ test.getMilliseconds() : "0"+ test.getMilliseconds() : test.getMilliseconds())+ " " + test.getDate()+ "."+ (test.getMonth() + 1) + "." + test.getFullYear();
};
