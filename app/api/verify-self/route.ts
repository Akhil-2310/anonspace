import { NextRequest, NextResponse } from "next/server";
import { 
  SelfBackendVerifier, 
  DefaultConfigStore,
  AllIds, VerificationConfig
} from '@selfxyz/core';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      attestationId, 
      proof, 
      publicSignals, 
      userContextData 
    } = body;
    

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json({
        status: 'error',
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
        error_code: "INVALID_INPUTS"
      }, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Extract group restriction info from userContextData to match frontend disclosures
    const userDefinedData = userContextData?.userDefinedData || '';
    const isAgeRestriction = userDefinedData.includes('(age:');
    const isNationalityRestriction = userDefinedData.includes('(nationality:');
    
    // Parse minimum age from the user defined data if it's an age restriction
    let minimumAge = 5; // default
    if (isAgeRestriction) {
      const ageMatch = userDefinedData.match(/\(age:\s*(\d+)\)/);
      if (ageMatch) {
        minimumAge = parseInt(ageMatch[1]);
      }
    }

    const disclosures_config: VerificationConfig = {
      excludedCountries: [],
      ofac: false,
      // Only set minimumAge if this is an age-based restriction
      ...(isAgeRestriction && { minimumAge }),
    };

    const configStore = new DefaultConfigStore(disclosures_config);

    const selfBackendVerifier = new SelfBackendVerifier(
      "anonspace",
      "https://524bf20dd866.ngrok-free.app/api/verify-self",
      true, // dev mode
      AllIds,
      configStore,
      "uuid", // user ID type as string
    );

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );
    
    if (!result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result.isValidDetails,
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "success",
        result: result.isValidDetails.isValid,
        credentialSubject: result.discloseOutput,
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      return NextResponse.json({
        status: "error",
        result: result.isValidDetails.isValid,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result,
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      reason: "Internal Error",
      error_code: "INTERNAL_ERROR"
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}