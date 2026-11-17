package com.myarcfitness.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigen plugins vóór super.onCreate registreren.
        registerPlugin(RustTimerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
