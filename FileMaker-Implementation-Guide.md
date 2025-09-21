# FileMaker Clocklet Implementation Guide

## Simple Self-Contained Implementation

This approach uses a single script that handles opening the clocklet, configuring it, and processing the result. No URL parameters or multiple scripts needed.

### Step 1: Create Your Time Picker Script

Copy this script template and customize the configuration section at the top:

#### Script: "SetStartTime"
```
# Configuration (edit these values as needed)
Set Variable [ $workingStart ; 9 ]    # 9 AM
Set Variable [ $workingEnd ; 17 ]      # 5 PM  
Set Variable [ $webViewerName ; "StartTimeWebViewer" ]
Set Variable [ $popoverName ; "StartTimePopover" ]
Set Variable [ $targetField ; "YourTable::StartTime" ]

# Check if this is a callback from the clocklet
If [ Get(ScriptParameter) ≠ "" ]
    # This is a callback - parse JSON state and set the time
    Set Variable [ $state ; Get(ScriptParameter) ]
    Set Variable [ $time ; JSONGetElement($state ; "time") ]
    Set Field [ Evaluate($targetField) ; $time ]
    Close Popover
    Exit Script [ ]
End If

# This is the initial call - open popover and configure clocklet
Show Popover [ Object Name: Evaluate($popoverName) ; YourLayout::StartTimePopover ; Position: Below ]
Pause/Resume Script [ Duration (seconds): 0.2 ]

# Create configuration JSON with current field value
Set Variable [ $currentTime ; Evaluate($targetField) ]
Set Variable [ $config ; JSONSetElement ( "{}" ; 
    [ "callbackScript" ; Get(ScriptName) ; JSONString ] ;
    [ "startHour" ; $workingStart ; JSONNumber ] ;
    [ "endHour" ; $workingEnd ; JSONNumber ] ;
    [ "currentTime" ; $currentTime ; JSONString ]
) ]

# Configure the clocklet
Set Variable [ $jsFunction ; "setClockletConfig(" & Quote($config) & ")" ]
Perform JavaScript in Web Viewer [ 
    Object Name: Evaluate($webViewerName) ; 
    Function: $jsFunction 
]
```

### Step 2: Create Layout Objects

You need to create these objects on your FileMaker layout:

#### Required Layout Objects:
1. **Button** → Name it anything (e.g., "StartTimeButton")
   - Set button action to: `Perform Script ["SetStartTime"]`

2. **Popover** → Name it exactly as specified in script: `"StartTimePopover"`
   - Position: Below the button
   - Contains the WebViewer (see next step)

3. **WebViewer** → Name it exactly as specified in script: `"StartTimeWebViewer"`
   - Place inside the popover
   - Set Web Address to: `data:text/html,[YOUR_HTML_CONTENT]`
   - Size: Recommended 300x300 pixels

#### WebViewer HTML Content:
Simply embed the entire clocklet HTML file content as a data URI:
```
data:text/html,<!DOCTYPE html><html>...entire filemaker-clocklet.html content...</html>
```

**No URL parameters needed** - everything is configured via the script!

### Step 3: Multiple Time Pickers (Optional)

To create additional time pickers, simply duplicate the script and change the configuration:

#### Example: "SetEndTime" Script
```
# Configuration (edit these values as needed)
Set Variable [ $workingStart ; 9 ]     # 9 AM
Set Variable [ $workingEnd ; 17 ]       # 5 PM
Set Variable [ $webViewerName ; "EndTimeWebViewer" ]    # Different name
Set Variable [ $popoverName ; "EndTimePopover" ]        # Different name  
Set Variable [ $targetField ; "YourTable::EndTime" ]    # Different field

# ... rest of script is identical ...
```

Then create corresponding layout objects with the new names.

### Step 4: Customization Options

#### Dynamic Working Hours:
You can make working hours dynamic based on user, role, or any other logic:

```
# In your script configuration section:
If [ Get(AccountName) = "EarlyShift" ]
    Set Variable [ $workingStart ; 6 ]   # 6 AM
    Set Variable [ $workingEnd ; 14 ]    # 2 PM
Else If [ Get(AccountName) = "LateShift" ]  
    Set Variable [ $workingStart ; 14 ]  # 2 PM
    Set Variable [ $workingEnd ; 22 ]    # 10 PM
Else
    Set Variable [ $workingStart ; 9 ]   # 9 AM
    Set Variable [ $workingEnd ; 17 ]    # 5 PM
End If
```

## Key Benefits

### ✅ **Simple Setup**
- **One script per time picker** - easy to understand and maintain
- **No URL parameters** - everything configured via FileMaker script
- **Self-contained** - script handles both opening and result processing

### ✅ **Reactive State**
- **Shows current field value** - clocklet reflects existing time
- **Rich feedback** - returns complete state information as JSON
- **Automatic callback** - script name passed automatically via `Get(ScriptName)`

### ✅ **WebDirect Compatible**
- **Data URI approach** - no external dependencies
- **No mixed content issues** - fully contained within FileMaker
- **Works offline** - no server requirements

## Implementation Tips

1. **Object Naming**: Make sure WebViewer and Popover names in your script match the actual layout object names exactly
2. **Testing**: Test in both FileMaker Pro and WebDirect environments
3. **Error Handling**: The script includes automatic error handling and retry logic
4. **Customization**: All configuration is at the top of the script - easy to modify

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

This approach provides maximum flexibility while keeping implementation simple and maintainable.
