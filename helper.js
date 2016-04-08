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
      {
        process.stderr.write("Not a directory: " + path + "\n");
        process.exit(-2);
      }
    }
    catch (e) {
      process.stderr.write("Unable to read directory: " + path + "\n");
      process.exit(-3);
    }
  }
,
  printList : function(premsg, list)
  {
    console.log(premsg);
    console.log(list);
  }
}
