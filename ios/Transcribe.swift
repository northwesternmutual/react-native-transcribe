import AVFoundation
import Foundation

@objc(Transcribe)
public final class Transcribe: RCTEventEmitter {
    var hasListeners: Bool = false
    var isRecording: Bool = false
    var activeAudioController: TranscribeAudioController?

    // Override implementation of queue setup
    // - Returns: when true class initialized on the main thread,
    //            when false class initialized on a background thread
    @objc public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc public override func supportedEvents() -> [String]! {
        return [ "onError", "isRecording", "onResults"]
    }
    
    // Will be called when this module's first listener is added.
    public override func startObserving() {
        print("Transcribe startObserving")
        hasListeners = true
    }
    
    // Will be called when this module's last listener is removed, or on dealloc.
    public override func stopObserving() {
        print("Transcribe stopObserving")
        hasListeners = false
    }
    
    override init(){
        super.init()
        
        print("Transcribe init")
    }

    @objc(start:withRejecter:)
    func start(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        print("start")
        if(!isRecording){
            installTap()
        }
        isRecording = true
        self.sendEvent(withName: "isRecording", body: ["value": isRecording] )
        resolve( isRecording )
    }

    @objc(stop)
    func stop() {
        print("stop")
        removeTap()
        isRecording = false
        self.sendEvent(withName: "isRecording", body: ["value": isRecording] )
    }
    
    func installTap() {
        print("installTap - START")

        self.activeAudioController = TranscribeAudioController(sampleRate: 8000, bufferSize: 1024)
        guard let audioController = self.activeAudioController else {
            return
        }
        do {
            try audioController.session.setCategory(AVAudioSession.Category.playAndRecord)
            audioController.session.requestRecordPermission { (success) in
                if success {
                    print("Permission Granted")
                } else {
                    print("Permission Denied")
                    self.activeAudioController = nil
                    return
                }
            }
        } catch {
            print("Audio session not loaded properly \(error)")
            self.activeAudioController = nil
            return
        }

        do {
            try audioController.session.setActive(true)
        }catch{
            print("error setting active true \(error)")
        }
        
        let input = audioController.input
        
        if(input.inputFormat(forBus: 0).channelCount == 0){
            print("Not enough available inputs!")
            return
        }
        
        let format = input.inputFormat(forBus: 0)
        
        let sampleRate = audioController.session.sampleRate
        print("hardware sample rate = \(sampleRate), using specified rate = \(format.sampleRate)")

        let converterFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: Double(8000), channels: 1, interleaved: false)!
        guard let converter = AVAudioConverter(from: format, to: converterFormat) else {
            print("can not make audio converter")
            return
        }
        
        input.installTap(onBus: 0, bufferSize: AVAudioFrameCount(format.sampleRate/10), format: format) {
            (buffer: AVAudioPCMBuffer, when: AVAudioTime) -> Void in
            
            let convertedFrameCount = AVAudioFrameCount(converterFormat.sampleRate) * buffer.frameLength / AVAudioFrameCount(buffer.format.sampleRate)
            guard let convertedBuffer = AVAudioPCMBuffer(pcmFormat: converterFormat, frameCapacity: convertedFrameCount) else {
                print("can not make converted buffer")
                return
            }
            
            var error: NSError?
            converter.convert(to: convertedBuffer, error: &error) {_, outstatus in
                outstatus.pointee = AVAudioConverterInputStatus.haveData
                return buffer
            }
            
            guard error == nil else {
                print("audio convert error: \(error!)")
                return
            }
            
            let arraySize = Int(convertedBuffer.frameLength)
            var samples: Array<Float> = Array()
            samples = Array(UnsafeBufferPointer(start: convertedBuffer.floatChannelData![0], count:arraySize))
            self.sendEvent(withName: "onResults", body: ["value": samples] )
        }
        
        print("installTap - DONE")
    }
    
    func removeTap() {
        print("removeTap - START")
        activeAudioController?.input.removeTap(onBus: 0)
        do {
            try activeAudioController?.session.setActive(false)
        } catch {
            print("error setting active false \(error)")
        }
        self.activeAudioController = nil
        print("removeTap - DONE")
    }
}
