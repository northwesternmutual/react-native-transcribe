require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-transcribe"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "10.0" }
  s.source       = { :git => "https://github.com/northwesternmutual/react-native-transcribe/react-native-transcribe.git", :tag => "#{s.version}" }
  
  s.swift_version = '5.0'  
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.framework = 'AVFoundation'

  s.dependency "React-Core"
end
