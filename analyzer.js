textFilesLoader = require("text-files-loader");
sync = require("synchronize");

module.exports = {

    findLinesInDirectory : function( path, detect_pattern, extract_pattern )
    {
      var files;
      var data = [];

      // prepare text-files-loader
      textFilesLoader.setup(
      {
        recursive: true,
        matchRegExp: /\.js/
      });

      // read file contents
      files = sync.await(textFilesLoader.load(path, sync.defer()));

      // scan each file for lines matching detect_pattern
      for (var filename in files)
      {
        var matches = files[filename].match(detect_pattern);

        // if lines machting the detect_pattern were found
        if (matches != null && matches.length > 0)
        {
          // create enty for current file
          data[filename] = [];

          // extract target pattern from lines
          for (var index in matches)
          {
            var result = matches[index].match(extract_pattern)
            if (result != null) data[filename].push(result[1]);
          }
        }
      }

      return data;
    }
}
