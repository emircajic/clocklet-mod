## FileMaker Clocklet

This time selector is based on HTML Clocklet by luncheon. You can find it here: [Luncheon Clocklet](https://github.com/luncheon/clocklet).

Filemaker, unfortunately, doesn't offer a time picker worth of mention. Also, majority of time pickers that I tried are not very intuitive or user-friendly, as they require you to make multiple clicks or selections, so users find it more convenient to enter time manually. I tried to create a time picker that is simple and efficient, as it takes two clicks, one for hour and the other for minute, to select the desired time. 

In order to achieve this, I modified the clocklet to avoid choosing am/pm, and to select only time range which is most common, so it is possible to select times from 7:00 to 18:59, as those are  hours when most of the stuff happens. Furthermore, you are able to set the selectable time range to less than that, if your company, or your client, has different working hours.

## Implementation Guide

You need two layout objects and a script that handles opening the clocklet, configuring it, and processing the result. Couldn't make it simpler than that.

### Step 1: Create Layout Objects

You need to create these objects on your FileMaker layout:

#### Required Layout Objects:
1. **Popover** → Name it anything (e.g., "StartTimePopover")

2. **WebViewer** → Name it as you like, say: `"StartTimeWebViewer"`
   - **Place** inside the popover
   - **Size**: Recommended 320x320 pixels
   - **Content**: Embed the entire clocklet HTML file content as a data URI: `data:text/html,<!DOCTYPE html><html>...entire filemaker-clocklet.html content...</html>`

### Step 2: Create Your Time Picker Script
- Open the Script Workspace and create a new script named "SetStartTime".
- Create a script and recreate the script steps below (unfortunatelly you can't copy and paste the script steps, as FileMaker doesn't allow it, you must enter them manually. I could have made it easier for you if I included a FileMaker file, so you just copy/paste the script steps, but right now I don't have time for that. When I do, I will update this README.):

#### Script: "SetStartTime"
```
# Configuration (edit these values as needed)
Set Variable [ $workingStart ; 9 ]    # 9 AM
Set Variable [ $workingEnd ; 17 ]      # 5 PM  
Set Variable [ $webViewerName ; "StartTimeWebViewer" ] # Name of the webviewer object as you put it in the layout
Set Variable [ $targetField ; "YourTable::StartTime" ] # Note that this is a string noting the field name, not the field itself.

# Check if this is a callback from the clocklet
If [ Get(ScriptParameter) ≠ "" ]
    # This is a callback - parse JSON state and set the time
    Set Variable [ $state ; Get(ScriptParameter) ]
    Set Variable [ $time ; JSONGetElement($state ; "time") ]
    Set Field By Name [ $targetField ; $time ]
    Exit Script [ ]
End If

Set Variable [ $currentTime; Evaluate($targetField) ]

# Create configuration JSON
Set Variable [ $config ; JSONSetElement ( "{}";
    [ "callbackScript" ; Get(ScriptName) ; JSONString ] ;
    [ "startHour" ; $workingStart ; JSONNumber ] ;
    [ "endHour" ; $workingEnd ; JSONNumber ] ;
    [ "currentTime" ; $currentTime ; JSONString ]
 ) ]
    
Pause/Resume Script [Duration (seconds): 0.5]

Perform JavaScript in Web Viewer [ 
    Object Name: $webViewerName ; 
    Function: "setClockletConfig";
    Parameters: $config 
]

```
- Set **OnObjectEnter** trigger of the popover to: `Perform Script ["SetStartTime"]`

### Step 3: How It Works

1. **User clicks popover button** → Runs "SetStartTime" script in configuration mode 
2. **The script configures the webviewer while the popover opens** → The webviewer is configured with the configuration JSON created by the script
3. **User selects time** → Clocklet calls back "SetStartTime" with result
4. **Script processes result** → Sets field value

### Step 4: Multiple Time Pickers (Optional)

To create additional time pickers, duplicate the button script and change the configuration:

#### Example: "SetEndTime" Script
```
# Configuration (edit these values as needed)
Set Variable [ $workingStart ; 9 ]     # 9 AM
Set Variable [ $workingEnd ; 17 ]       # 5 PM
Set Variable [ $webViewerName ; "EndTimeWebViewer" ]    # Different name
Set Variable [ $targetField ; "YourTable::EndTime" ]    # Different field

# ... rest of script is identical to SetStartTime ...
```

- Set **OnObjectEnter** trigger of the popover to: `Perform Script ["SetEndTime"]`

### Step 5: Customization Options

#### Dynamic Working Hours:
You can make working hours dynamic based on user, role, or any other logic:

```
# In your script configuration section:
If [ Get(AccountName) = "EarlyShift" ]
    Set Variable [ $workingStart ; 7 ]   # 7 AM
    Set Variable [ $workingEnd ; 15 ]    # 3 PM
Else If [ Get(AccountName) = "LateShift" ]  
    Set Variable [ $workingStart ; 10 ]  # 10 AM
    Set Variable [ $workingEnd ; 18 ]    # 6 PM
Else
    Set Variable [ $workingStart ; 9 ]   # 9 AM
    Set Variable [ $workingEnd ; 17 ]    # 5 PM
End If
```

## Key Benefits

### ✅ **Simple Setup and Use**
- **One script per time picker** - easy to understand and maintain
- **No URL parameters** - everything configured via FileMaker script
- **Self-contained** - script handles both opening and result processing
- **Simple to use** - just two clicks to select time

### ✅ **Reactive State**
- **Shows current field value** - clocklet reflects existing time
- **Rich feedback** - returns complete state information as JSON
- **Automatic callback** - script name passed automatically via `Get(ScriptName)`

### ✅ **WebDirect Compatible**
- **Data URI approach** - no external dependencies
- **No mixed content issues** - fully contained within FileMaker
- **Works offline** - no server requirements

## Implementation Tips

1. **Object Naming**: Make sure WebViewer names in your script match the actual layout object names exactly
2. **Minify HTML**: Minify the HTML file before embedding it in the script to achieve better performance

## JSON State Exchange

The clocklet uses JSON for rich state communication:

**Configuration sent to clocklet:**
```json
{
  "callbackScript": "SetStartTime",
  "startHour": 9,
  "endHour": 17,
  "currentTime": "14:30"
}
```

**State returned from clocklet:**
```json
{
  "time": "15:45",
  "hour": 15,
  "minute": 45,
  "workingHours": {"start": 9, "end": 17},
  "config": {...}
}
```

## License

This project is licensed under the WTFPL. You can find it here: https://www.wtfpl.net
