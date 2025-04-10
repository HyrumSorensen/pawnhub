"use client";

import { useState } from "react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

type Step = {
  title: string;
  text: string;
  image: string;
};

const steps: Step[] = [
  {
    title: "Objective",
    text: "Be the first player to move your pawn to the opposite side of the board.",
    image: "/assets/tutorial-objective.png",
  },
  {
    title: "Moving",
    text: "On your turn, you may move your pawn one space in any direction — unless blocked by a wall.",
    image: "/assets/tutorial-move.png",
  },
  {
    title: "Placing Walls",
    text: "Instead of moving, you can place a wall to block your opponent. Walls must not completely block a player’s path.",
    image: "/assets/tutorial-wall.png",
  },
  {
    title: "Jumping",
    text: "If your pawn is directly next to the opponent, you may jump over them (or diagonally if blocked).",
    image: "/assets/tutorial-jump.png",
  },
  {
    title: "Winning",
    text: "Reach the opposite side of the board before your opponent to win!",
    image: "/assets/tutorial-win.png",
  },
];

export default function QuoridorTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const currentStep = steps[step];

  return (
    <div className="relative mt-4">
<button
  onClick={() => setOpen(true)}
  className="w-9 h-9 flex items-center justify-center rounded-full border border-black text-black hover:bg-black hover:text-white transition"
  aria-label="How to Play"
  title="How to Play"
>
  ?
</button>


      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2 text-center">
              {currentStep.title}
            </h2>

            <img
              src={currentStep.image}
              alt={currentStep.title}
              className="w-full rounded mb-4"
            />

            <p className="text-sm text-gray-700 mb-6 text-center">
              {currentStep.text}
            </p>

            {/* Step navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled={step === 0}
                className="flex items-center gap-1 px-3 py-1 border border-black text-black rounded disabled:opacity-30 hover:bg-black hover:text-white transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <span className="text-xs text-gray-500">
                Step {step + 1} of {steps.length}
              </span>

              <button
                onClick={() =>
                  setStep((prev) =>
                    Math.min(prev + 1, steps.length - 1)
                  )
                }
                disabled={step === steps.length - 1}
                className="flex items-center gap-1 px-3 py-1 border border-black text-black rounded disabled:opacity-30 hover:bg-black hover:text-white transition"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
