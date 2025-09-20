# FileMaker Clocklet Implementation Guide

## Recommended Approach: Data URI + JavaScript Call

This approach embeds the HTML directly in FileMaker and uses JavaScript calls to configure working hours.

### Step 1: Create FileMaker Scripts

#### Script: "ClockletReady"
```
# Called when the clocklet control is loaded and ready
# Set working hours based on your business logic
Perform JavaScript in Web Viewer [ Object Name: "TimePickerWebViewer" ; Function: "setClockletWorkingHours(9, 17)" ]
```

#### Script: "HandleTimeChange" 
```
# Called when user selects a time
# Parameter: Time string like "14:30"
Set Field [ YourTable::SelectedTime ; Get(ScriptParameter) ]
Close Popover
```

### Step 2: WebViewer Setup

#### In your FileMaker layout:
1. Create a WebViewer object
2. Name it "TimePickerWebViewer"
3. Set the Web Address to: `data:text/html,` + the HTML content

#### Data URI Format:
```
data:text/html,<!DOCTYPE html><html>...your entire HTML content...</html>
```

### Step 3: Dynamic Working Hours

You can make working hours dynamic based on user, department, etc.:

```
# In ClockletReady script:
If [ Get(AccountName) = "EarlyShift" ]
    Perform JavaScript in Web Viewer [ "setClockletWorkingHours(6, 14)" ]
Else If [ Get(AccountName) = "LateShift" ]  
    Perform JavaScript in Web Viewer [ "setClockletWorkingHours(14, 22)" ]
Else
    Perform JavaScript in Web Viewer [ "setClockletWorkingHours(9, 17)" ]
End If
```

## Alternative Approaches

### Option A: Server-Hosted (If you prefer)
- Host the HTML file on your server
- Use URL: `https://yourserver.com/clocklet.html?startHour=9&endHour=17`
- **WebDirect Consideration**: May have issues with external URLs

### Option B: Container Field
- Store HTML file in a FileMaker container field
- Export to temporary file and load in WebViewer
- More complex but fully self-contained

## WebDirect Compatibility

The **Data URI approach** is most WebDirect-friendly because:
- No external dependencies
- No HTTPS/HTTP mixed content issues
- No firewall/security restrictions
- Fully contained within FileMaker

## Implementation Tips

1. **Minify HTML**: Remove unnecessary whitespace for shorter data URI
2. **Error Handling**: Always wrap JavaScript calls in try/catch
3. **Testing**: Test in both FileMaker Pro and WebDirect
4. **Fallbacks**: Consider fallback UI if WebViewer fails

## Sample FileMaker Button Script
```
# Button to open time picker popover
Show Popover [ Object Name: "TimePickerPopover" ; YourLayout::TimePickerPopover ; Position: Below ]
# The popover contains the WebViewer with the clocklet
```

This approach gives you maximum flexibility and compatibility across all FileMaker deployment scenarios.
