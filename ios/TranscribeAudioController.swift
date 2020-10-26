//
//  TranscribeAudioController.swift
//  CocoaAsyncSocket
//
//  Created by Ryan Furness on 7/6/20.
//

import Foundation
import AVFoundation

class TranscribeAudioController{
    var sampleRate: Double { return session.sampleRate }
    var bufferSize: AVAudioFrameCount { return session.bufferSizeInSamples }
    var input: AVAudioNode { return engine.inputNode }
   
    var session: AVAudioSession { return AVAudioSession.sharedInstance() }
    var engine:  AVAudioEngine!
    
    init(sampleRate: Double, bufferSize: AVAudioFrameCount) {
        initializeAudioSession()
        configureAudioSession(sampleRate, bufferSize)
        initializeAudioEngine()
        registerObservers()
        printAudioConfiguration()
    }
    
    deinit {
        stopAudioEngine()
        deregisterObservers()
    }
    
    func initializeAudioSession() {
        do {
            try session.setCategory(AVAudioSession.Category.playAndRecord)
            session.requestRecordPermission { (success) in
                if success {
                    print("Permission Granted")
                } else {
                    print("Permission Denied")
                }
            }
        }    catch    {
            print("Audio session not loaded properly \(error)")
        }
    }
    
    func configureAudioSession() {
        configureAudioSession(44100, AVAudioFrameCount(1024))
    }
    
    func configureAudioSession(_ sampleRate: Double, _ bufferSize: AVAudioFrameCount) {
        do {
            let portDescriptions = session.availableInputs!
            for port in portDescriptions {
                if (port.channels?.count ?? 0) > 1 {
                    print(port)
                    try session.setPreferredInput(port)
                    try session.setPreferredInputNumberOfChannels(2)
                }
            }
            try session.setPreferredSampleRate( sampleRate )
            try session.setPreferredIOBufferDuration( Double(bufferSize) / sampleRate )
        } catch {
            print("Couldnt configure Audio Session: \(error)")
        }
    }
    
    func initializeAudioEngine() {
        engine = AVAudioEngine()
        let audioFormat: AVAudioFormat = engine.inputNode.outputFormat(forBus: 0)
        
        // add mixer node
        engine.connect(engine.inputNode, to: engine.mainMixerNode, format: audioFormat)
        engine.mainMixerNode.outputVolume = 0.0
        
        if Thread.isMainThread {
            self.runAudioEngine()
        } else {
            DispatchQueue.global().async {
                DispatchQueue.main.async {
                    self.runAudioEngine()
                }
        }
        }
    }
    
    
    func runAudioEngine() {
        engine.prepare()
        do     {
            try engine.start()
        }    catch    {
            print("Couldnt load the engine: \(error)")
        }
    }
    
    func stopAudioEngine() {
        engine.stop()
    }
    
    func restartAudioSession() {
        let currentSampleRate = sampleRate;
        let currentBufferSize = bufferSize;
        stopAudioEngine()
        initializeAudioSession()
        configureAudioSession(currentSampleRate, currentBufferSize)
        initializeAudioEngine()
    }
       
    func printAudioConfiguration() {
        print("SampleRate is: \(sampleRate)")
        print("Buffer Size is: \(bufferSize)")
        print("Current Route Inputs: \(session.currentRoute.inputs.map{$0.portName})")
        print("Current Route Outputs: \(session.currentRoute.outputs.map{$0.portName})")
        print("Available Inputs \(session.availableInputs!.map{ $0.portName })")
        print("Number of Inputs: \(engine.inputNode.numberOfInputs)")
        print("Input Format: \(engine.inputNode.inputFormat(forBus: 0))")
        print("Number of Outputs: \(engine.outputNode.numberOfOutputs)")
    }
    
    func registerObservers() {
        NotificationCenter.default.addObserver(self, selector: #selector(AudioSessionInterrupted), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(AudioRouteChanged), name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(AudioEngineChanged), name: NSNotification.Name.AVAudioEngineConfigurationChange, object: nil)
    }
    
    func deregisterObservers() {
        NotificationCenter.default.removeObserver(self, name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVAudioEngineConfigurationChange, object: nil)
    }
}

extension TranscribeAudioController {
    @objc func AudioSessionInterrupted() {
        print("Audio Session Interrupted")
        stopAudioEngine()
        initializeAudioSession()
        runAudioEngine()
        printAudioConfiguration()
    }
    
    @objc func AudioRouteChanged() {
        print("Audio Route Change")
        stopAudioEngine()
        initializeAudioSession()
        runAudioEngine()
        printAudioConfiguration()
    }
    
    @objc func AudioEngineChanged() {
        print("Audio Engine Changed")
        stopAudioEngine()
        print("stop")
        initializeAudioSession()
        print("initialize")
        runAudioEngine()
        print("run")
        printAudioConfiguration()
    }
}

extension TranscribeAudioController {
    
    func getCurrentEnginesName() -> String{
        return session.currentRoute.inputs.first?.portName ?? String()
    }
}

extension AVAudioSession  {
    var bufferSizeInSamples: AVAudioFrameCount { return AVAudioFrameCount(self.sampleRate * self.ioBufferDuration) }
}
