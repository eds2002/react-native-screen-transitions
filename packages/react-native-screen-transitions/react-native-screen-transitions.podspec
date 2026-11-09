require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-screen-transitions"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/eds2002/react-native-screen-transitions"
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/eds2002/react-native-screen-transitions.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)
end
