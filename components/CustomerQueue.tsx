import React from 'react';
import { Customer } from '../types';
import { BROTH_COLORS, BROTH_LABELS } from '../constants';
import { CustomerAsset, SmallIconGukbap, SmallIconRice } from './GameAssets';

interface CustomerQueueProps {
  customers: Customer[];
  onServe: (customerId: number, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const CustomerQueue: React.FC<CustomerQueueProps> = ({ customers, onServe }) => {
  return (
    <div className="flex justify-start gap-1 overflow-x-auto p-2 h-full items-end px-2 no-scrollbar">
      {customers.length === 0 && (
        <div className="w-full text-center text-gray-500 text-sm animate-pulse pt-10 font-bold absolute left-0 right-0">
          손님이 오는 중...
        </div>
      )}
      
      {customers.map((customer) => {
        const patiencePercent = (customer.patience / customer.maxPatience) * 100;
        const isAngry = patiencePercent < 30;
        const isHappy = patiencePercent > 70;

        return (
          <button
            key={customer.id}
            onClick={(e) => onServe(customer.id, e)}
            className="relative flex flex-col items-center shrink-0 w-24 group transition-transform active:scale-95 mx-1"
          >
            {/* Order Bubble */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-xl px-2 py-1 flex flex-col items-center shadow-lg z-10 min-w-[80px] animate-[bounce_1s_infinite]">
               <div className="flex items-center gap-1 mb-1">
                 <SmallIconGukbap type={customer.order.broth} />
                 <span className={`text-[10px] font-bold px-1 rounded ${BROTH_COLORS[customer.order.broth]}`}>
                   {BROTH_LABELS[customer.order.broth]}
                 </span>
               </div>
               {customer.order.needsRice && (
                 <div className="flex items-center gap-1 border-t border-gray-200 pt-1 w-full justify-center">
                    <SmallIconRice />
                    <span className="text-[10px] text-gray-800 font-bold">솥밥</span>
                 </div>
               )}
               {/* Triangle for bubble */}
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-black rotate-45"></div>
            </div>

            {/* Character Graphic */}
            <div className="w-20 h-20">
               <CustomerAsset seed={customer.id} mood={isAngry ? 'angry' : isHappy ? 'happy' : 'normal'} />
            </div>

            {/* Patience Bar */}
            <div className="w-16 h-2 bg-gray-300 border border-black mt-1 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${isAngry ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${patiencePercent}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CustomerQueue;