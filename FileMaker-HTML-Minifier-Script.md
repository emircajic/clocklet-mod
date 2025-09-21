# FileMaker HTML Minifier Script

## Script: "MinifyHTMLField"

This script takes HTML content from a field, sends it to a web minification service, and replaces the field content with the minified version.

```
# Configuration
Set Variable [ $sourceField ; "YourTable::HTMLTemplate" ]  # Field containing HTML
Set Variable [ $apiURL ; "https://www.toptal.com/developers/html-minifier/api/raw" ]

# Get current HTML content
Set Variable [ $htmlContent ; GetField($sourceField) ]

# Check if field has content
If [ IsEmpty($htmlContent) ]
    Show Custom Dialog [ "Error" ; "No HTML content found in field." ]
    Exit Script [ ]
End If

# Show progress
Show Custom Dialog [ "Minifying..." ; "Sending HTML to minification service..." ; "Cancel" ]
If [ Get(LastMessageChoice) = 2 ]
    Exit Script [ ]
End If

# Prepare the request
Set Variable [ $postData ; "input=" & URLEncode($htmlContent) ]

# Prepare cURL options for POST request
Set Variable [ $curlOptions ; 
    "-X POST" & 
    " -H \"Content-Type: application/x-www-form-urlencoded\"" &
    " -d \"" & $postData & "\""
]

# Make the API call
Insert from URL [ 
    $apiURL ; 
    Verify SSL Certificates: Off ;
    cURL options: $curlOptions ;
    Target: $result
]

# Check if request was successful
If [ Get(LastError) ≠ 0 ]
    Show Custom Dialog [ "Error" ; "Failed to connect to minification service. Error: " & Get(LastError) ]
    Exit Script [ ]
End If

# Validate the response (basic check)
If [ IsEmpty($result) or Left($result, 5) = "Error" ]
    Show Custom Dialog [ "Error" ; "Minification service returned an error or empty response." ]
    Exit Script [ ]
End If

# Calculate compression ratio
Set Variable [ $originalSize ; Length($htmlContent) ]
Set Variable [ $minifiedSize ; Length($result) ]
Set Variable [ $compressionRatio ; Round(($originalSize - $minifiedSize) / $originalSize * 100, 1) ]

# Show preview and confirm
Show Custom Dialog [ 
    "Minification Complete" ; 
    "Original size: " & $originalSize & " characters" & ¶ & 
    "Minified size: " & $minifiedSize & " characters" & ¶ & 
    "Compression: " & $compressionRatio & "%" & ¶ & ¶ & 
    "Replace field content with minified version?" ; 
    "Replace" ; "Cancel" 
]

If [ Get(LastMessageChoice) = 1 ]
    # Replace field content with minified version
    Set Field [ Evaluate($sourceField) ; $result ]
    
    # Show success message
    Show Custom Dialog [ 
        "Success" ; 
        "HTML has been minified and saved." & ¶ & 
        "Saved " & ($originalSize - $minifiedSize) & " characters (" & $compressionRatio & "% reduction)"
    ]
Else
    # User cancelled - do nothing
    Show Custom Dialog [ "Cancelled" ; "Original HTML content preserved." ]
End If
```

## Alternative API Options

### Option 1: HTML Minifier API (Toptal)
- **URL**: `https://www.toptal.com/developers/html-minifier/api/raw`
- **Method**: POST
- **Data**: `input=<your_html_content>`
- **Pros**: Simple, reliable, free
- **Cons**: Requires internet connection

### Option 2: Minify API
- **URL**: `https://www.minifier.org/minify`
- **Method**: POST  
- **Data**: `input=<your_html_content>&type=html`
- **Pros**: Supports multiple formats
- **Cons**: May have rate limits

### Option 3: Custom Node.js Service (Advanced)
If you want more control, you could set up your own minification service:

```javascript
// Simple Express.js server
const express = require('express');
const minify = require('html-minifier').minify;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/minify', (req, res) => {
    try {
        const minified = minify(req.body.input, {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            minifyCSS: true,
            minifyJS: true
        });
        res.send(minified);
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

app.listen(3000);
```

## Enhanced Script with Multiple API Fallbacks

```
# Enhanced version with fallback APIs
Set Variable [ $sourceField ; "YourTable::HTMLTemplate" ]
Set Variable [ $htmlContent ; GetField($sourceField) ]

If [ IsEmpty($htmlContent) ]
    Show Custom Dialog [ "Error" ; "No HTML content found in field." ]
    Exit Script [ ]
End If

# Try primary API
Set Variable [ $apiURL ; "https://www.toptal.com/developers/html-minifier/api/raw" ]
Set Variable [ $postData ; "input=" & URLEncode($htmlContent) ]
Set Variable [ $curlOptions ; 
    "-X POST" & 
    " -H \"Content-Type: application/x-www-form-urlencoded\"" &
    " -d \"" & $postData & "\""
]

Insert from URL [ 
    $apiURL ; 
    Verify SSL Certificates: Off ;
    cURL options: $curlOptions ;
    Target: $result
]

# If primary API fails, try fallback
If [ Get(LastError) ≠ 0 or IsEmpty($result) ]
    Set Variable [ $apiURL ; "https://www.minifier.org/minify" ]
    Set Variable [ $postData ; "input=" & URLEncode($htmlContent) & "&type=html" ]
    Set Variable [ $curlOptions ; 
        "-X POST" & 
        " -H \"Content-Type: application/x-www-form-urlencoded\"" &
        " -d \"" & $postData & "\""
    ]
    
    Insert from URL [ 
        $apiURL ; 
        Verify SSL Certificates: Off ;
        cURL options: $curlOptions ;
        Target: $result
    ]
End If

# Continue with validation and field update as above...
```

## Usage Tips

1. **Test First**: Always test with a copy of your HTML before running on production data
2. **Backup**: Consider creating a backup field before minification
3. **Validation**: The script includes basic validation, but you might want to add more checks
4. **Rate Limits**: Be aware that free APIs may have rate limits
5. **Offline Alternative**: Consider setting up a local minification service for high-volume use

## Button Setup

Create a button on your layout that runs this script:
- **Button Action**: Perform Script ["MinifyHTMLField"]
- **Position**: Near your HTML template field
- **Label**: "Minify HTML"

This will give you one-click HTML minification directly within FileMaker!
