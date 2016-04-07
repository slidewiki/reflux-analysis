var fs = require('fs');

module.exports = {

  die : function(error)
  {
    process.stderr.write(error.msg + "\n");
    process.exit(error.code);
  }
,
  checkDir : function(path)
  {
    try
    {
      stats = fs.lstatSync(path);

      if (!stats.isDirectory())
        helper.die({code : -2, msg : "Not a directory: " + path});
    }
    catch (e)
    {
      die({code : -3, msg : "Unable to read directory: "} + path);
    }
  }
,
  printList : function(premsg, list)
  {
    console.log(premsg);
    console.log(list);
  }
}
