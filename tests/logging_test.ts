import "../src/index.js";

logging.init({ level: "trace" }, logging.dailyrotation({ dest: "./v.log" }));

logging.info("=========");

logging.error("=================");
