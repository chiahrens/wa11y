# wa11y

Runs a [pa11y](https://github.com/pa11y/pa11y) scan using Selenium and Chrome Driver or using SauceLabs.

### Usage
Start Selenium and run scan using Chrome Driver
```
wa11y https://www.google.com
```

Run using SauceLabs with connections tunneling back to your computer
```
export SAUCE_USERNAME=yourusername
export SAUCE_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
wa11y http://www.google.com --sauce --tunnel
```

### Command line options
  * --sauce - if present, runs on SauceLabs
  * --tunnel - if present, opens tunnel back to host 
  * --browser - webdriver browser name. Defaults to chrome
  * --version - webdriver browser version. Defaults to latest
  * --platform - webdriver platform. Defaults to OS X 10.11
  * --verbose - if present, logs verbosely
  * --ignore - semi-colin delimited list of violations to ignore
  * --rootElement - css selector of root element to scan. Defaults to body
